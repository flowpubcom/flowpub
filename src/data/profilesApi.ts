import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { mapFlowRow } from "./flowsApi";
import type { Flow } from "./types";

// Lecturas server-side de perfiles públicos (/@usuario) y sus Flows.

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  /** Año de alta («En FlowPub desde YYYY»). */
  sinceYear: number | null;
  /** Nombres de sus temas elegidos. */
  topics: string[];
}

export interface ProfileStats {
  flows: number;
  followers: number;
  following: number;
}

export const fetchProfileByUsername = cache(
  async (username: string): Promise<PublicProfile | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,username,display_name,avatar_url,bio,location,created_at,profile_tags(tags(name_es))",
      )
      .eq("username", username)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id as string,
      username: data.username as string,
      displayName: (data.display_name || data.username) as string,
      avatarUrl: (data.avatar_url as string | null) ?? null,
      bio: (data.bio as string | null) ?? null,
      location: (data.location as string | null) ?? null,
      sinceYear: data.created_at
        ? new Date(data.created_at as string).getFullYear()
        : null,
      topics: (data.profile_tags ?? [])
         
        .map((pt: any) => pt.tags?.name_es)
        .filter(Boolean),
    };
  },
);

export const fetchProfileStats = cache(
  async (profileId: string): Promise<ProfileStats> => {
    const supabase = await createClient();
    const [flows, followers, following] = await Promise.all([
      supabase
        .from("flows")
        .select("id", { count: "exact", head: true })
        .eq("author_id", profileId)
        .in("status", ["published", "featured"]),
      supabase
        .from("follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("followee_id", profileId),
      supabase
        .from("follows")
        .select("followee_id", { count: "exact", head: true })
        .eq("follower_id", profileId),
    ]);
    return {
      flows: flows.count ?? 0,
      followers: followers.count ?? 0,
      following: following.count ?? 0,
    };
  },
);

// Hint !author_id: desambigua flows↔profiles (hay caminos vía likes/saves).
const SELECT =
  "id,title,body_md,transcript_raw,audio_url,duration_s,cover_kind,like_count,comment_count,created_at,lang,status," +
  "author:profiles!author_id(id,username,display_name,avatar_url)," +
  "flow_tags(tags(slug,name_es,name_en,sort))";

/** Flows de un autor. La RLS ya decide: otros ven published/featured; el
 *  dueño también ve sus borradores (se separan por `status` en la UI). */
export const fetchFlowsByAuthor = cache(
  async (profileId: string): Promise<Flow[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("flows")
      .select(SELECT)
      .eq("author_id", profileId)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error || !data) return [];
    return data.map(mapFlowRow).filter((f): f is Flow => f !== null);
  },
);

/** Flows que le gustaron a un perfil (los likes son públicos por RLS). */
export const fetchLikedFlows = cache(
  async (profileId: string): Promise<Flow[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("likes")
      .select(`created_at,flows(${SELECT})`)
      .eq("user_id", profileId)
      .not("flow_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error || !data) return [];
    return data
       
      .map((r: any) => (r.flows ? mapFlowRow(r.flows) : null))
      .filter((f): f is Flow => f !== null);
  },
);

/** ¿El usuario con sesión sigue a este perfil? (para el botón Seguir). */
export const fetchViewerFollows = cache(
  async (profileId: string): Promise<{ viewerId: string | null; following: boolean }> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { viewerId: null, following: false };
    const { data } = await supabase
      .from("follows")
      .select("followee_id")
      .eq("follower_id", user.id)
      .eq("followee_id", profileId)
      .maybeSingle();
    return { viewerId: user.id, following: !!data };
  },
);
