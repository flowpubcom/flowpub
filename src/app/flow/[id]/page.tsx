import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchFlow } from "@/data/flowsApi";
import { fetchComments } from "@/data/commentsApi";
import { FlowReader } from "@/components/flow/FlowReader";
import { RelatedFlows } from "@/components/flow/RelatedFlows";
import { safeJsonLd } from "@/lib/jsonLd";
import { SITE, absoluteUrl, mdToPlainText, countWords, breadcrumbList, RSS_ALT } from "@/lib/seo";
import { audioMimeFromUrl } from "@/lib/format";

function isPublicFlow(status?: string): boolean {
  return status === "published" || status === "featured";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const flow = await fetchFlow(id); // cache(): misma consulta que la página
  if (!flow) return { title: "Flow" };

  const description = flow.excerpt || `${flow.title} — un Flow en FlowPub.`;
  const authorUrl = absoluteUrl(`/@${flow.author.username}`);
  const isEn = flow.lang === "en";

  return {
    title: flow.title,
    description,
    // Defensa en profundidad: un Flow no publicado (borrador visible solo a su
    // autor por RLS) nunca se indexa, aunque la RLS algún día se relaje.
    robots: { index: isPublicFlow(flow.status), follow: true },
    alternates: { canonical: `/flow/${flow.id}`, types: RSS_ALT },
    keywords: flow.tagNames?.length ? flow.tagNames : undefined,
    authors: [{ name: flow.author.displayName, url: authorUrl }],
    openGraph: {
      type: "article",
      title: flow.title,
      description,
      url: `/flow/${flow.id}`,
      locale: isEn ? "en_US" : "es_MX",
      publishedTime: flow.createdAt,
      authors: [flow.author.displayName],
      section: flow.tag || undefined,
      tags: flow.tagNames?.length ? flow.tagNames : undefined,
    },
    twitter: { card: "summary_large_image", title: flow.title, description },
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

  const description = flow.excerpt || `${flow.title} — un Flow en FlowPub.`;
  const authorId = `${absoluteUrl(`/@${flow.author.username}`)}#person`;
  const ogImage = absoluteUrl(`/flow/${flow.id}/opengraph-image`);
  const bodyText = flow.bodyMd ? mdToPlainText(flow.bodyMd) : "";

  // Datos estructurados: el Flow como artículo con su audio (voice-first). El
  // transcript crudo viaja en AudioObject.transcript — es la única vía legible
  // por máquina de nuestra ventaja: cada Flow vive en audio Y en texto.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: flow.title,
    description,
    image: [ogImage],
    datePublished: flow.createdAt,
    inLanguage: flow.lang,
    isAccessibleForFree: true,
    articleSection: flow.tag || undefined,
    keywords: flow.tagNames?.length ? flow.tagNames.join(", ") : undefined,
    ...(bodyText ? { articleBody: bodyText, wordCount: countWords(bodyText) } : {}),
    author: {
      "@type": "Person",
      "@id": authorId,
      name: flow.author.displayName,
      url: absoluteUrl(`/@${flow.author.username}`),
      ...(flow.author.avatarUrl ? { image: flow.author.avatarUrl } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: "FlowPub",
      url: SITE,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icono-512") },
    },
    mainEntityOfPage: absoluteUrl(`/flow/${flow.id}`),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: flow.likeCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: flow.commentCount,
      },
    ],
    ...(flow.audioUrl
      ? {
          audio: {
            "@type": "AudioObject",
            name: flow.title,
            description,
            contentUrl: flow.audioUrl,
            duration: `PT${flow.durationSeconds}S`,
            encodingFormat: audioMimeFromUrl(flow.audioUrl),
            uploadDate: flow.createdAt,
            inLanguage: flow.lang,
            ...(flow.transcriptRaw ? { transcript: flow.transcriptRaw } : {}),
          },
        }
      : {}),
  };

  // Migas: Inicio → tema → este Flow (rich result de breadcrumb en el SERP).
  const breadcrumb = breadcrumbList([
    { name: "Inicio", path: "/" },
    ...(flow.tagSlug ? [{ name: flow.tag, path: `/tema/${flow.tagSlug}` }] : []),
    { name: flow.title, path: `/flow/${flow.id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }}
      />
      <FlowReader flow={flow} initialComments={comments} />
      {/* Enlaces internos (SSR): más del autor y más del tema. Refuerzan el
          rastreo, la autoridad temática y el descubrimiento. */}
      {isPublicFlow(flow.status) && <RelatedFlows flow={flow} />}
    </>
  );
}
