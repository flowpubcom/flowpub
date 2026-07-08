import { createClient } from "@/lib/supabase/client";

// Acciones de la pantalla de Configuración (cliente, como el usuario; RLS manda).

export interface PushPrefs {
  messages: boolean;
  follows: boolean;
  comments: boolean;
}

/** Lee las preferencias de push del usuario con sesión (con defaults tolerantes). */
export async function fetchPushPrefs(): Promise<PushPrefs> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fallback: PushPrefs = { messages: true, follows: true, comments: true };
  if (!user) return fallback;
  const { data } = await supabase
    .from("profiles")
    .select("push_prefs")
    .eq("id", user.id)
    .maybeSingle();
  const p = (data?.push_prefs ?? {}) as Partial<PushPrefs>;
  return {
    messages: p.messages !== false,
    follows: p.follows !== false,
    comments: p.comments !== false,
  };
}

/** Guarda las preferencias de push (columna profiles.push_prefs). */
export async function savePushPrefs(prefs: PushPrefs): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase
    .from("profiles")
    .update({ push_prefs: prefs })
    .eq("id", user.id);
  return { ok: !error };
}

/** Borra la cuenta del usuario (RPC security-definer) y cierra sesión. */
export async function deleteMyAccount(): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false };
  await supabase.auth.signOut();
  return { ok: true };
}
