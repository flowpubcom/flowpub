import { createClient } from "@/lib/supabase/client";

// Interacciones del lector (cliente, como el usuario autenticado; RLS manda).
// Patrón optimista: la UI pinta al instante y llama aquí; si regresa ok:false,
// revierte. Sin sesión → la UI manda a /entrar.

type Result = { ok: boolean };

async function me() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function setFlowLike(flowId: string, on: boolean): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false };
  const q = on
    ? supabase.from("likes").insert({ user_id: user.id, flow_id: flowId })
    : supabase.from("likes").delete().eq("user_id", user.id).eq("flow_id", flowId);
  const { error } = await q;
  // 23505 = ya existía el like (doble click): el estado deseado ya está.
  return { ok: !error || error.code === "23505" };
}

export async function setCommentLike(
  commentId: string,
  on: boolean,
): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false };
  const q = on
    ? supabase.from("likes").insert({ user_id: user.id, comment_id: commentId })
    : supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("comment_id", commentId);
  const { error } = await q;
  return { ok: !error || error.code === "23505" };
}

export async function setFollow(
  followeeId: string,
  on: boolean,
): Promise<Result> {
  const { supabase, user } = await me();
  if (!user || user.id === followeeId) return { ok: false };
  const q = on
    ? supabase
        .from("follows")
        .insert({ follower_id: user.id, followee_id: followeeId })
    : supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("followee_id", followeeId);
  const { error } = await q;
  return { ok: !error || error.code === "23505" };
}

export async function setSave(flowId: string, on: boolean): Promise<Result> {
  const { supabase, user } = await me();
  if (!user) return { ok: false };
  const q = on
    ? supabase.from("saves").insert({ user_id: user.id, flow_id: flowId })
    : supabase.from("saves").delete().eq("user_id", user.id).eq("flow_id", flowId);
  const { error } = await q;
  return { ok: !error || error.code === "23505" };
}

/** Compartir un Flow: Web Share API con caída a portapapeles. */
export async function shareFlow(title: string, path: string): Promise<"shared" | "copied" | "failed"> {
  const url = `${window.location.origin}${path}`;
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return "shared";
    }
  } catch {
    // cancelado por el usuario → no copies encima
    return "failed";
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
