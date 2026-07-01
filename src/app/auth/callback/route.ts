import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback de OAuth (Google) y de los enlaces de confirmación por correo.
// Intercambia el `code` por una sesión (cookies) y redirige.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Solo rutas internas: nada de //evil.com ni URLs absolutas (open redirect).
  const rawNext = searchParams.get("next") ?? "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/entrar?error=auth`);
}
