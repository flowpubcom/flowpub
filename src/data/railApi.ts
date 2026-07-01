import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, TrendingTag } from "./types";

// Datos reales del riel derecho del Pub: temas con más Flows + voces sugeridas.

export const fetchTrending = cache(async (): Promise<TrendingTag[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("slug,name_es,flow_tags(count)")
    .eq("active", true);
  if (error || !data) return [];
  return data
    .map((t) => ({
      name: t.name_es as string,
      slug: t.slug as string,
      flows: (t.flow_tags?.[0]?.count as number) ?? 0,
    }))
    .filter((t) => t.flows > 0)
    .sort((a, b) => b.flows - a.flows)
    .slice(0, 3);
});

export interface SuggestedVoice {
  profile: Profile;
  topics: string;
  following: boolean;
}

export const fetchSuggested = cache(async (): Promise<SuggestedVoice[]> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,profile_tags(tags(name_es))")
    .eq("onboarded", true)
    .limit(8);
  if (error || !data) return [];

  const candidates = data.filter((p) => p.id !== user?.id).slice(0, 3);

  // ¿A quiénes de estos ya sigo?
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
});
