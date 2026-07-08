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

// Puente ligero entre la bandeja (NotificationsView) y el punto de la campana
// (useUnreadCount): al marcar leído avisamos por un evento del window para que
// el punto se actualice al instante, sin esperar a la siguiente navegación.
export const NOTIF_READ_EVENT = "fp-notif-read";
export const NOTIF_READ_ALL_EVENT = "fp-notif-read-all";

/** Una notificación pasó a leída → resta 1 al punto de la campana. */
export function announceNotifRead() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(NOTIF_READ_EVENT));
}

/** Se marcaron todas como leídas → apaga el punto de la campana. */
export function announceAllNotifRead() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(NOTIF_READ_ALL_EVENT));
}
