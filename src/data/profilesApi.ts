import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { FLOW_SELECT_V1, FLOW_SELECT_V2, mapFlowRow } from "./flowsApi";
import type { Flow } from "./types";

// Lecturas server-side de perfiles públicos (/@usuario) y sus Flows.

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  /** Banner subido por el usuario; null = banner generativo. */
  bannerUrl: string | null;
  bio: string | null;
  location: string | null;
  /** Año de alta («En FlowPub desde YYYY»). */
  sinceYear: number | null;
  /** Nombres de sus temas elegidos. */
  topics: string[];
  /** Invitaciones canjeadas (para la badge OG); 0 si aún no corre migration_18. */
  inviteRedemptions: number;
}

export interface ProfileStats {
  flows: number;
  followers: number;
  following: number;
}

export const fetchProfileByUsername = cache(
  async (username: string): Promise<PublicProfile | null> => {
    const supabase = await createClient();
    const SEL =
      "id,username,display_name,avatar_url,banner_url,bio,location,created_at,profile_tags(tags(name_es))";
    // Cascada tolerante: sin banner_url (migración 14 pendiente) reintenta.
    const SEL_LEGACY =
      "id,username,display_name,avatar_url,bio,location,created_at,profile_tags(tags(name_es))";
    let { data, error } = await supabase
      .from("profiles")
      .select(SEL)
      .eq("username", username)
      .maybeSingle();
    if (error?.code === "42703") {
      ({ data, error } = await supabase
        .from("profiles")
        .select(SEL_LEGACY)
        .eq("username", username)
        .maybeSingle());
    }
    if (error || !data) return null;
    const row = data as Record<string, any>;

    // Invitaciones canjeadas (badge OG): RPC pública, tolerante a que la
    // migración 18 aún no haya corrido (42883 = función inexistente).
    const { data: redemptions, error: redErr } = await supabase.rpc(
      "invite_redemptions",
      { profile: row.id as string },
    );

    return {
      id: row.id as string,
      username: row.username as string,
      displayName: (row.display_name || row.username) as string,
      avatarUrl: (row.avatar_url as string | null) ?? null,
      bannerUrl: (row.banner_url as string | null) ?? null,
      bio: (row.bio as string | null) ?? null,
      location: (row.location as string | null) ?? null,
      sinceYear: row.created_at
        ? new Date(row.created_at as string).getFullYear()
        : null,
      topics: (row.profile_tags ?? [])

        .map((pt: any) => pt.tags?.name_es)
        .filter(Boolean),
      inviteRedemptions: redErr ? 0 : Number(redemptions ?? 0),
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


/** Flows de un autor. La RLS ya decide: otros ven published/featured; el
 *  dueño también ve sus borradores (se separan por `status` en la UI). */
export const fetchFlowsByAuthor = cache(
  async (profileId: string): Promise<Flow[]> => {
    const supabase = await createClient();
    const q = (sel: string) =>
      supabase
        .from("flows")
        .select(sel)
        .eq("author_id", profileId)
        .order("created_at", { ascending: false })
        .limit(60);
    let { data, error } = await q(FLOW_SELECT_V2);
    if (error?.code === "42703") ({ data, error } = await q(FLOW_SELECT_V1));
    if (error || !data) return [];
    return data.map(mapFlowRow).filter((f): f is Flow => f !== null);
  },
);

/** Flows que le gustaron a un perfil (los likes son públicos por RLS). */
export const fetchLikedFlows = cache(
  async (profileId: string): Promise<Flow[]> => {
    const supabase = await createClient();
    const q = (sel: string) =>
      supabase
        .from("likes")
        .select(`created_at,flows(${sel})`)
        .eq("user_id", profileId)
        .not("flow_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(30);
    let { data, error } = await q(FLOW_SELECT_V2);
    if (error?.code === "42703") ({ data, error } = await q(FLOW_SELECT_V1));
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
