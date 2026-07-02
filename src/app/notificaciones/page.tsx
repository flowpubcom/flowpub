import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { NotificationsView } from "@/components/notifications/NotificationsView";
import { fetchNotifications } from "@/data/notificationsApi";

export const metadata: Metadata = { title: "Notificaciones" };

// Centro de notificaciones. El middleware ya gatea /notificaciones (sin
// sesión → /entrar?next=); aquí solo se lee y se pinta.
export default async function NotificacionesPage() {
  const { items } = await fetchNotifications();

  return (
    <AppShell active="notifications">
      <NotificationsView initialItems={items} />
    </AppShell>
  );
}
