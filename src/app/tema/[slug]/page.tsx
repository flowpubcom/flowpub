import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { PubRightRail } from "@/components/feed/PubRightRail";
import { FlowCard } from "@/components/feed/FlowCard";
import { fetchFlowsByTag } from "@/data/flowsApi";
import { safeJsonLd } from "@/lib/jsonLd";
import { fetchTags } from "@/data/tagsApi";
import { fetchSuggested, fetchTrending } from "@/data/railApi";

// Hub SEO por tema: una página indexable por categoría (/tema/arte, …), con
// los Flows del tema, copy propio y JSON-LD. Los chips y el riel enlazan aquí.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flowpub.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = (await fetchTags()).find((t) => t.slug === slug);
  if (!tag) return { title: "Tema" };
  const lower = tag.nameEs.toLowerCase();
  return {
    title: `${tag.nameEs} en voz — Flows de ${lower}`,
    description: `Publicaciones de ${lower} que nacen de la voz: se escuchan en audio (hasta 3 minutos) y se leen como artículo, siempre con su transcript. El Pub de ${lower} en FlowPub.`,
    alternates: { canonical: `/tema/${slug}` },
  };
}

export default async function TemaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [tags, flows, trending, suggested] = await Promise.all([
    fetchTags(),
    fetchFlowsByTag(slug),
    fetchTrending(),
    fetchSuggested(),
  ]);
  const tag = tags.find((t) => t.slug === slug);
  if (!tag) notFound();

  const lower = tag.nameEs.toLowerCase();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Flows de ${tag.nameEs}`,
    description: `Voces sobre ${lower} publicadas en FlowPub.`,
    url: `${SITE}/tema/${slug}`,
    isPartOf: { "@type": "WebSite", name: "FlowPub", url: SITE },
  };

  return (
    <AppShell
      active="pub"
      rightRail={<PubRightRail trending={trending} suggested={suggested} />}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <header className="border-b border-line-soft px-4 pb-6 pt-7 lg:px-7">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-2">
          Tema
        </p>
        <h1 className="mt-1 font-serif text-[34px] font-medium leading-tight text-ink">
          {tag.nameEs}
        </h1>
        <p className="mt-2 max-w-[52ch] font-sans text-[14px] leading-relaxed text-text-2">
          Voces sobre {lower} que se escuchan y se leen — cada Flow trae su
          audio, su versión pulida y su transcript original.
        </p>
      </header>
      <div className="mx-auto flex max-w-[640px] flex-col gap-5 px-4 py-5 lg:px-7">
        {flows.map((flow) => (
          <FlowCard key={flow.id} flow={flow} />
        ))}
        {flows.length === 0 && (
          <p className="py-16 text-center font-sans text-[14px] text-text-2">
            Aún no hay Flows de este tema. Sé la primera voz.
          </p>
        )}
      </div>
    </AppShell>
  );
}
