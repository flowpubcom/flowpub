import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ProfileBanner } from "@/components/profile/ProfileBanner";
import { ProfileView } from "@/components/profile/ProfileView";
import {
  fetchFlowsByAuthor,
  fetchLikedFlows,
  fetchProfileByUsername,
  fetchProfileStats,
  fetchViewerFollows,
} from "@/data/profilesApi";

// Perfil público: /@usuario. El segmento dinámico captura «@julio» (el prefijo
// @ es obligatorio; cualquier otra ruta suelta cae a 404).

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flowpub.lat";

async function resolveUsername(param: string): Promise<string | null> {
  const raw = decodeURIComponent(param);
  if (!raw.startsWith("@")) return null;
  const username = raw.slice(1).toLowerCase();
  return username.length >= 3 ? username : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const username = await resolveUsername((await params).username);
  if (!username) return { title: "Perfil" };
  const profile = await fetchProfileByUsername(username);
  if (!profile) return { title: "Perfil" };
  return {
    title: `${profile.displayName} (@${profile.username})`,
    description:
      profile.bio ??
      `Los Flows de ${profile.displayName} en FlowPub: publicaciones que nacen de la voz.`,
    alternates: { canonical: `/@${profile.username}` },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const username = await resolveUsername((await params).username);
  if (!username) notFound();

  const profile = await fetchProfileByUsername(username);
  if (!profile) notFound();

  const [allFlows, liked, stats, viewer] = await Promise.all([
    fetchFlowsByAuthor(profile.id),
    fetchLikedFlows(profile.id),
    fetchProfileStats(profile.id),
    fetchViewerFollows(profile.id),
  ]);

  const flows = allFlows.filter((f) => f.status !== "draft");
  const drafts = allFlows.filter((f) => f.status === "draft");
  const isOwn = viewer.viewerId === profile.id;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.displayName,
      alternateName: `@${profile.username}`,
      description: profile.bio ?? undefined,
      url: `${SITE}/@${profile.username}`,
    },
  };

  return (
    <AppShell active="profile">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProfileBanner seed={profile.username} imageUrl={profile.bannerUrl} />
      <ProfileView
        profile={profile}
        stats={stats}
        flows={flows}
        drafts={drafts}
        liked={liked}
        isOwn={isOwn}
        initialFollowing={viewer.following}
      />
    </AppShell>
  );
}
