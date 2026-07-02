import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { mapFlowRow } from "./flowsApi";
import type { SuggestedVoice } from "./railApi";
import type { Flow, TrendingTag } from "./types";

// Lecturas server-side de /explorar: temas con conteo, voces y búsqueda.

/** Todos los temas activos con su número de Flows (grid de Explorar). */
export const fetchTagsWithCounts = cache(async (): Promise<TrendingTag[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("slug,name_es,sort,flow_tags(count)")
    .eq("active", true)
    .order("sort");
  if (error || !data) return [];
  return data.map((t) => ({
    name: t.name_es as string,
    slug: t.slug as string,
    flows: (t.flow_tags?.[0]?.count as number) ?? 0,
  }));
});

// Los patrones ilike viajan dentro de un or() de PostgREST: comas, paréntesis
// y comodines del usuario romperían la sintaxis. Se neutralizan.
function sanitize(q: string): string {
  return q.replace(/[,%()*\\]/g, " ").replace(/\s+/g, " ").trim();
}

// Mismo shape del feed (autor + tags); el hint !author_id es obligatorio.
const SELECT =
  "id,title,body_md,transcript_raw,audio_url,duration_s,cover_kind,like_count,comment_count,created_at,lang,status," +
  "author:profiles!author_id(id,username,display_name,avatar_url)," +
  "flow_tags(tags(slug,name_es,name_en,sort))";

/** Busca Flows publicados por título o cuerpo. */
export const searchFlows = cache(async (q: string): Promise<Flow[]> => {
  const clean = sanitize(q);
  if (clean.length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flows")
    .select(SELECT)
    .in("status", ["published", "featured"])
    .or(`title.ilike.%${clean}%,body_md.ilike.%${clean}%`)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error || !data) return [];
  return data.map(mapFlowRow).filter((f): f is Flow => f !== null);
});

/** Voces (perfiles onboarded): con `q` busca por nombre/usuario; sin `q`,
 *  las más recientes. Enriquece con temas y si el lector ya las sigue. */
export const fetchVoices = cache(
  async (q?: string, limit = 12): Promise<SuggestedVoice[]> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url,created_at,profile_tags(tags(name_es))")
      .eq("onboarded", true);

    const clean = q ? sanitize(q) : "";
    if (clean) {
      query = query.or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit + 1);
    if (error || !data) return [];

    const candidates = data.filter((p) => p.id !== user?.id).slice(0, limit);

    let followingSet = new Set<string>();
    if (user && candidates.length) {
      const { data: fs } = await supabase
        .from("follows")
        .select("followee_id")
        .eq("follower_id", user.id)
        .in("followee_id", candidates.map((p) => p.id));
      followingSet = new Set((fs ?? []).map((f) => f.followee_id as string));
    }

    return candidates.map((p) => ({
      profile: {
        id: p.id as string,
        username: p.username as string,
        displayName: (p.display_name || p.username) as string,
        avatarUrl: (p.avatar_url as string | null) ?? null,
      },
      topics: (p.profile_tags ?? [])

        .map((pt: any) => pt.tags?.name_es)
        .filter(Boolean)
        .slice(0, 2)
        .join(" · "),
      following: followingSet.has(p.id as string),
    }));
  },
);
