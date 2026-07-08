import type { MetadataRoute } from "next";

// Sitemap dinámico: home + hubs de tema + Flows publicados. Lee vía REST con
// la anon key (valores públicos) y cachea 1 h — sin cookies, cacheable.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flowpub.app";

async function fetchRows<T>(path: string): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tags, flows] = await Promise.all([
    fetchRows<{ slug: string }>("tags?select=slug&active=eq.true&order=sort"),
    fetchRows<{ id: string; created_at: string }>(
      "flows?select=id,created_at&status=in.(published,featured)&order=created_at.desc&limit=1000",
    ),
  ]);

  return [
    { url: SITE, changeFrequency: "hourly", priority: 1 },
    ...tags.map((t) => ({
      url: `${SITE}/tema/${t.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...flows.map((f) => ({
      url: `${SITE}/flow/${f.id}`,
      lastModified: new Date(f.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
