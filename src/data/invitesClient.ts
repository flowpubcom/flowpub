import { createClient } from "@/lib/supabase/client";

// Invitaciones desde el navegador: las mías (tarjeta del perfil propio) y el
// canje post-registro. RLS: solo veo las mías; el canje es un RPC.

export interface MyInvites {
  /** Códigos sin usar (los que puedo compartir). */
  remaining: number;
  /** El siguiente código a compartir (el más viejo sin usar). */
  nextCode: string | null;
  /** Admin = invitaciones infinitas (se reponen al canjearse). */
  unlimited: boolean;
}

export async function fetchMyInvites(): Promise<MyInvites | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data, error }, { data: me }] = await Promise.all([
    supabase
      .from("invites")
      .select("code,used_at")
      .is("used_at", null)
      .order("created_at")
      .limit(9),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);
  // 42P01 = la tabla aún no existe (migración pendiente): la tarjeta se oculta.
  if (error) return null;
  return {
    remaining: data?.length ?? 0,
    nextCode: (data?.[0]?.code as string | undefined) ?? null,
    unlimited: me?.role === "admin",
  };
}

/** Canjea el código guardado tras el onboarding. Best-effort e idempotente. */
export async function redeemInvite(code: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("redeem_invite", {
    invite_code: code,
  });
  return !error && data === true;
}
