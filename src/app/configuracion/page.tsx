import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { SettingsView } from "@/components/settings/SettingsView";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Configuración",
  robots: { index: false, follow: false },
};

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/configuracion");

  return (
    <AppShell active="config">
      <SettingsView email={user.email ?? ""} />
    </AppShell>
  );
}
