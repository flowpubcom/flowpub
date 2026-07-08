import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

// Sitemap dinámico: home + hubs de tema + Flows publicados + perfiles públicos.
// Lee vía REST con la anon key (valores públicos) y cachea 1 h — sin cookies,
// cacheable.

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
  const [tags, flows, profiles] = await Promise.all([
    fetchRows<{ slug: string }>("tags?select=slug&active=eq.true&order=sort"),
    fetchRows<{ id: string; created_at: string; author_id: string }>(
      "flows?select=id,created_at,author_id&status=in.(published,featured)&order=created_at.desc&limit=1000",
    ),
    fetchRows<{ id: string; username: string; created_at: string }>(
      "profiles?select=id,username,created_at&order=created_at.desc&limit=1000",
    ),
  ]);

  // Solo perfiles con al menos un Flow publicado: un perfil vacío es contenido
  // delgado (y el propio perfil ya se auto-noindexa en ese caso).
  const authorsWithFlows = new Set(flows.map((f) => f.author_id));

  return [
    { url: SITE, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE}/design`, changeFrequency: "monthly", priority: 0.5 },
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
    // Perfiles públicos con contenido: /@usuario es una entidad indexable (Person).
    ...profiles
      .filter((p) => authorsWithFlows.has(p.id))
      .map((p) => ({
        url: `${SITE}/@${p.username}`,
        lastModified: new Date(p.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
  ];
}
