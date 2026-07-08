import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchFlow } from "@/data/flowsApi";
import { fetchComments } from "@/data/commentsApi";
import { FlowReader } from "@/components/flow/FlowReader";
import { safeJsonLd } from "@/lib/jsonLd";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flowpub.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const flow = await fetchFlow(id); // cache(): misma consulta que la página
  if (!flow) return { title: "Flow" };
  return {
    title: flow.title,
    description: flow.excerpt,
    alternates: { canonical: `/flow/${flow.id}` },
    openGraph: {
      type: "article",
      title: flow.title,
      description: flow.excerpt,
      publishedTime: flow.createdAt,
      authors: [flow.author.displayName],
    },
  };
}

export default async function FlowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flow = await fetchFlow(id);
  if (!flow) notFound();
  const comments = await fetchComments(id);

  // Datos estructurados: el Flow como artículo con su audio (voice-first).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: flow.title,
    description: flow.excerpt,
    datePublished: flow.createdAt,
    inLanguage: "es",
    author: {
      "@type": "Person",
      name: flow.author.displayName,
      url: `${SITE}/@${flow.author.username}`,
    },
    publisher: { "@type": "Organization", name: "FlowPub", url: SITE },
    mainEntityOfPage: `${SITE}/flow/${flow.id}`,
    ...(flow.audioUrl
      ? {
          audio: {
            "@type": "AudioObject",
            contentUrl: flow.audioUrl,
            duration: `PT${flow.durationSeconds}S`,
            inLanguage: "es",
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <FlowReader flow={flow} initialComments={comments} />
    </>
  );
}
