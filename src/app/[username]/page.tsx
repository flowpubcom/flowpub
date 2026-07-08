import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ProfileBanner } from "@/components/profile/ProfileBanner";
import { ProfileView } from "@/components/profile/ProfileView";
import { safeJsonLd } from "@/lib/jsonLd";
import { absoluteUrl, RSS_ALT } from "@/lib/seo";
import { safeHref, socialUrl } from "@/lib/links";
import {
  fetchFlowsByAuthor,
  fetchLikedFlows,
  fetchProfileByUsername,
  fetchProfileStats,
  fetchViewerFollows,
} from "@/data/profilesApi";

// Perfil público: /@usuario. El segmento dinámico captura «@julio» (el prefijo
// @ es obligatorio; cualquier otra ruta suelta cae a 404).

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
  const stats = await fetchProfileStats(profile.id); // cache(): comparte con la página
  const description =
    profile.bio ??
    `Los Flows de ${profile.displayName} en FlowPub: publicaciones que nacen de la voz.`;
  return {
    title: `${profile.displayName} (@${profile.username})`,
    description,
    // Un perfil sin Flows publicados es contenido delgado: no lo indexamos
    // (pero sí lo seguimos, por si más tarde publica).
    robots: { index: stats.flows > 0, follow: true },
    alternates: { canonical: `/@${profile.username}`, types: RSS_ALT },
    openGraph: {
      type: "profile",
      title: `${profile.displayName} (@${profile.username})`,
      description,
      url: `/@${profile.username}`,
    },
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

  // sameAs: web + redes verificadas (fuerte señal de entidad-autor / E-E-A-T).
  // Todo pasa por safeHref → solo URLs http(s) reales llegan al JSON-LD.
  const sameAs = [
    profile.website ? safeHref(profile.website) : null,
    profile.socials.instagram
      ? safeHref(socialUrl("instagram", profile.socials.instagram))
      : null,
    profile.socials.x ? safeHref(socialUrl("x", profile.socials.x)) : null,
    profile.socials.tiktok
      ? safeHref(socialUrl("tiktok", profile.socials.tiktok))
      : null,
    profile.socials.youtube
      ? safeHref(socialUrl("youtube", profile.socials.youtube))
      : null,
  ].filter((u): u is string => !!u);

  const hasAddress = !!(profile.city || profile.state || profile.country);
  const profileUrl = absoluteUrl(`/@${profile.username}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      // Mismo @id que Article.author en cada Flow → Google fusiona la entidad
      // del autor en todo el sitio.
      "@id": `${profileUrl}#person`,
      name: profile.displayName,
      alternateName: `@${profile.username}`,
      description: profile.bio ?? undefined,
      url: profileUrl,
      mainEntityOfPage: profileUrl,
      ...(profile.avatarUrl ? { image: profile.avatarUrl } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      ...(hasAddress
        ? {
            address: {
              "@type": "PostalAddress",
              ...(profile.city ? { addressLocality: profile.city } : {}),
              ...(profile.state ? { addressRegion: profile.state } : {}),
              ...(profile.country ? { addressCountry: profile.country } : {}),
            },
          }
        : {}),
    },
  };

  return (
    <AppShell active="profile">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
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
