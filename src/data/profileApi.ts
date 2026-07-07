import { createClient } from "@/lib/supabase/client";

// Escrituras del onboarding desde el cliente (como el usuario autenticado; RLS
// exige que profile_id / id == auth.uid()).

const USERNAME_RE = /^[a-z0-9_]+$/;

/** Normaliza a lo que aceptamos como usuario: minúsculas, a-z 0-9 _ */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function isValidUsername(u: string): boolean {
  return u.length >= 3 && u.length <= 30 && USERNAME_RE.test(u);
}

/** ¿El usuario está libre? (best-effort; la unicidad real la garantiza la BD.) */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let q = supabase.from("profiles").select("id").eq("username", username);
  if (user) q = q.neq("id", user.id); // no cuentes el mío propio
  const { data } = await q.maybeSingle();
  return !data;
}

export type OnboardingResult =
  | { ok: true }
  | { ok: false; error: "no-session" | "username-taken" | "generic" };

/** Edición de perfil (pantalla Perfil → «Editar perfil»). */
export async function updateProfile(input: {
  displayName: string;
  username: string;
  bio?: string;
  /** "YYYY-MM-DD" | null para borrarla | undefined = no tocarla. */
  birthdate?: string | null;
}): Promise<OnboardingResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "no-session" };

  const base: Record<string, unknown> = {
    display_name: input.displayName.trim(),
    username: input.username,
    bio: input.bio?.trim() || null,
  };
  let { error } = await supabase
    .from("profiles")
    .update(
      input.birthdate === undefined
        ? base
        : { ...base, birthdate: input.birthdate },
    )
    .eq("id", user.id);
  // Cascada tolerante: sin migración 15, guarda lo demás sin la fecha.
  if (error?.code === "PGRST204" || error?.code === "42703" || error?.code === "42501") {
    ({ error } = await supabase.from("profiles").update(base).eq("id", user.id));
  }
  if (error) {
    if (error.code === "23505") return { ok: false, error: "username-taken" };
    return { ok: false, error: "generic" };
  }
  return { ok: true };
}

/** Sube la foto al bucket `avatars` y la fija en el perfil. */
export async function uploadAvatar(file: File): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/avatar-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return null;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = data.publicUrl;
  const { error: pErr } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);
  return pErr ? null : url;
}

/** Sube el banner al bucket `avatars` y lo fija en el perfil. Cascada
 *  tolerante: si `banner_url` aún no existe (migración 14 pendiente), avisa. */
export async function uploadBanner(
  file: File,
): Promise<{ url: string | null; pending?: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { url: null };

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/banner-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return { url: null };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = data.publicUrl;
  const { error: pErr } = await supabase
    .from("profiles")
    .update({ banner_url: url })
    .eq("id", user.id);
  if (
    pErr?.code === "PGRST204" ||
    pErr?.code === "42703" ||
    pErr?.code === "42501"
  ) {
    return { url: null, pending: true }; // columna/grant sin migrar (14)
  }
  return { url: pErr ? null : url };
}

export async function completeOnboarding(input: {
  displayName: string;
  username: string;
  bio?: string;
  tagIds: number[];
}): Promise<OnboardingResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "no-session" };

  const { error: pErr } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName.trim(),
      username: input.username,
      bio: input.bio?.trim() || null,
      onboarded: true,
    })
    .eq("id", user.id);

  if (pErr) {
    if (pErr.code === "23505") return { ok: false, error: "username-taken" };
    return { ok: false, error: "generic" };
  }

  // Reescribe los intereses (idempotente si repite el onboarding).
  await supabase.from("profile_tags").delete().eq("profile_id", user.id);
  if (input.tagIds.length) {
    const rows = input.tagIds.map((tag_id) => ({
      profile_id: user.id,
      tag_id,
    }));
    const { error: tErr } = await supabase.from("profile_tags").insert(rows);
    if (tErr) return { ok: false, error: "generic" };
  }

  return { ok: true };
}
