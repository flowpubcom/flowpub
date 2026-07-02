import { createClient } from "@/lib/supabase/client";

// Acciones del lector sobre su propia bandeja (cliente; RLS acota a `user_id
// = auth.uid()` y solo permite tocar la columna `read`).

/** Badge de la campana: conteo ligero, se llama al montar el chrome. */
export async function fetchUnreadNotifCount(): Promise<number> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  return !error;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  return !error;
}
