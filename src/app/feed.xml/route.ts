import { SITE } from "@/lib/seo";
import { excerptOf } from "@/lib/format";

// Feed RSS 2.0 del Pub: sindicación y descubrimiento. Lee sin cookies (anon
// key, REST) igual que el sitemap, así queda cacheable. El podcast RSS con la
// namespace de iTunes (Apple/Spotify) queda pendiente: necesita arte cuadrado
// ≥1400px, el tamaño en bytes del audio y una categoría — otra sesión.

export const revalidate = 3600;

interface FeedRow {
  id: string;
  title: string;
  body_md: string | null;
  created_at: string;
}

function xmlEscape(s: string): string {
  return s
    // Quita los caracteres de control ilegales en XML 1.0 (válidos: \t \n \r y
    // ≥0x20): uno solo (p. ej. U+000C en un título editado por REST) invalidaría
    // el feed entero para todos los lectores.
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function fetchFeedRows(): Promise<FeedRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/flows?select=id,title,body_md,created_at&status=in.(published,featured)&order=created_at.desc&limit=50`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return [];
    return (await res.json()) as FeedRow[];
  } catch {
    return [];
  }
}

export async function GET(): Promise<Response> {
  const rows = await fetchFeedRows();
  const buildDate = (rows[0] ? new Date(rows[0].created_at) : new Date()).toUTCString();

  const items = rows
    .map((r) => {
      const link = `${SITE}/flow/${r.id}`;
      const desc = excerptOf(r.body_md ?? "");
      return `    <item>
      <title>${xmlEscape(r.title || "Flow")}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(r.created_at).toUTCString()}</pubDate>
      <description>${xmlEscape(desc)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FlowPub — El Pub</title>
    <link>${SITE}</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Voces que se vuelven publicación: Flows que se escuchan en audio y se leen como artículo.</description>
    <language>es</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
