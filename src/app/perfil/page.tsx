import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// «/perfil» = el perfil propio: resuelve el username y manda a /@usuario.
export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/perfil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.username) redirect("/entrar");

  redirect(`/@${profile.username}`);
}
