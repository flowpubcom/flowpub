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
  /** Lugar de origen (opcional). Cualquiera puede faltar. */
  city: string | null;
  state: string | null;
  country: string | null;
  /** Página web (URL http(s) ya normalizada). */
  website: string | null;
  /** Redes sociales: handle limpio (sin @), o null. */
  socials: {
    instagram: string | null;
    x: string | null;
    tiktok: string | null;
    youtube: string | null;
  };
  /** Fecha de alta ISO («En FlowPub desde el {fecha}»); formatear con fullDate(). */
  sinceDate: string | null;
  /** Temas elegidos, con slug para enlazar a su hub (/tema/[slug]). */
  topics: { name: string; slug: string }[];
  /** Invitaciones canjeadas (para la badge OG); 0 si aún no corre migration_18. */
  inviteRedemptions: number;
  /** ¿La lectura trajo las columnas de origen/redes/web (migración 20 + grant)?
   *  Si es false (lectura degradada), el editor NO debe reescribir esos campos
   *  para no borrar datos reales por una lectura incompleta. */
  hasLinks: boolean;
}

export interface ProfileStats {
  flows: number;
  followers: number;
  following: number;
}

export const fetchProfileByUsername = cache(
  async (username: string): Promise<PublicProfile | null> => {
    const supabase = await createClient();
    const TAGS = "profile_tags(tags(name_es,slug))";
    // Cascada tolerante por columnas (grant por columna): full (migración 20) →
    // pre-20 (con banner) → legacy (sin banner). 42501 = columna sin grant,
    // 42703 = columna inexistente — ambas caen al select más chico.
    const SEL_FULL = `id,username,display_name,avatar_url,banner_url,bio,location,city,state,country,website,instagram,x,tiktok,youtube,created_at,${TAGS}`;
    const SEL_PRE20 = `id,username,display_name,avatar_url,banner_url,bio,location,created_at,${TAGS}`;
    const SEL_LEGACY = `id,username,display_name,avatar_url,bio,location,created_at,${TAGS}`;
    const missing = (code?: string) => code === "42703" || code === "42501";

    const run = (sel: string) =>
      supabase.from("profiles").select(sel).eq("username", username).maybeSingle();

    let { data, error } = await run(SEL_FULL);
    let hasLinks = !missing(error?.code); // ¿el select con las columnas nuevas pasó?
    if (missing(error?.code)) {
      hasLinks = false;
      ({ data, error } = await run(SEL_PRE20));
    }
    if (missing(error?.code)) ({ data, error } = await run(SEL_LEGACY));
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
      city: (row.city as string | null) ?? null,
      state: (row.state as string | null) ?? null,
      country: (row.country as string | null) ?? null,
      website: (row.website as string | null) ?? null,
      socials: {
        instagram: (row.instagram as string | null) ?? null,
        x: (row.x as string | null) ?? null,
        tiktok: (row.tiktok as string | null) ?? null,
        youtube: (row.youtube as string | null) ?? null,
      },
      sinceDate: (row.created_at as string | null) ?? null,
      topics: (row.profile_tags ?? [])
        .map((pt: any) =>
          pt.tags?.name_es && pt.tags?.slug
            ? { name: pt.tags.name_es as string, slug: pt.tags.slug as string }
            : null,
        )
        .filter((t: { name: string; slug: string } | null): t is { name: string; slug: string } => t !== null),
      inviteRedemptions: redErr ? 0 : Number(redemptions ?? 0),
      hasLinks,
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
