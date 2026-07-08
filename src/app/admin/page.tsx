import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { AdminView } from "@/components/admin/AdminView";
import {
  fetchAdminAnalytics,
  fetchAdminFlows,
  fetchAdminMetrics,
  fetchAdminSettings,
  fetchAdminTags,
  fetchAdminUsers,
  fetchIsAdmin,
} from "@/data/adminApi";

export const metadata: Metadata = {
  title: "Panel de control",
  robots: { index: false, follow: false },
};

// Solo admin: el middleware exige sesión; aquí se exige el rol (y la RLS
// vuelve a exigirlo en cada escritura — el gate visual no es la seguridad).
export default async function AdminPage() {
  const isAdmin = await fetchIsAdmin();
  if (!isAdmin) redirect("/");

  const [metrics, analytics, flows, users, tags, settings] = await Promise.all([
    fetchAdminMetrics(),
    fetchAdminAnalytics(),
    fetchAdminFlows(),
    fetchAdminUsers(),
    fetchAdminTags(),
    fetchAdminSettings(),
  ]);

  return (
    <AppShell active="admin">
      <AdminView
        metrics={metrics}
        analytics={analytics}
        flows={flows}
        users={users}
        tags={tags}
        settings={settings}
      />
    </AppShell>
  );
}
