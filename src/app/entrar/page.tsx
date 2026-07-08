import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchTags } from "@/data/tagsApi";
import { Onboarding } from "@/components/onboarding/Onboarding";

// Pantalla de auth: sin valor de búsqueda (y es el destino del redirect de las
// rutas gateadas, que un crawler sí alcanza) → fuera del índice.
export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: true },
};

// Onboarding / auth. Ruta full-screen (fuera del chrome del Pub).
export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const initialMode =
    m === "login" ? "login" : m === "signup" ? "signup" : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Quien ya completó el onboarding no ve esta pantalla.
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.onboarded) redirect("/");
  }

  const tags = await fetchTags();
  return <Onboarding tags={tags} initialMode={initialMode} />;
}
