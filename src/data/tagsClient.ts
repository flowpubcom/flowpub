import { createClient } from "@/lib/supabase/client";

// Temas desde el cliente (como el usuario autenticado). La RLS manda:
// tags_insert_own permite proponer un tema; el grant de columna (migration_17)
// solo deja escribir slug/name_es/name_en/sort (active cae al default true).

/** Slug saneado: minúsculas, sin acentos, guiones (igual que adminClient). */
export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type CreateTagResult =
  | { ok: true; name: string }
  | { ok: false; reason: "invalid" | "denied" | "generic" };

/**
 * Crea (o reutiliza) un tema y devuelve su name_es para seleccionarlo.
 * - 3–24 caracteres, sin solo-espacios.
 * - Si el slug ya existe, devuelve el tema existente (no duplica).
 * - Degrada con gracia si la migración no corrió (RLS/privilegio → 'denied').
 */
export async function createTag(nameRaw: string): Promise<CreateTagResult> {
  const name = nameRaw.trim();
  if (name.length < 3 || name.length > 24) return { ok: false, reason: "invalid" };
  const slug = slugify(name);
  if (!slug) return { ok: false, reason: "invalid" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "denied" };

  // ¿Ya existe? Reutiliza (evita duplicar y el 23505 del unique de slug).
  const { data: existing } = await supabase
    .from("tags")
    .select("name_es")
    .eq("slug", slug)
    .maybeSingle();
  if (existing?.name_es) return { ok: true, name: existing.name_es as string };

  // Sort al final (append). Ambos, admin y usuario, aplican max+1.
  const { count } = await supabase
    .from("tags")
    .select("id", { count: "exact", head: true });

  const { error } = await supabase.from("tags").insert({
    slug,
    name_es: name,
    name_en: name, // el usuario solo nombra en su idioma; EN = ES por ahora
    sort: (count ?? 0) + 1,
  });
  if (error) {
    // 23505: carrera con el unique de slug → reutiliza el existente.
    if (error.code === "23505") {
      const { data: dup } = await supabase
        .from("tags")
        .select("name_es")
        .eq("slug", slug)
        .maybeSingle();
      if (dup?.name_es) return { ok: true, name: dup.name_es as string };
    }
    // 42501 (privilegio) / permission denied: la migración 17 aún no corre.
    if (error.code === "42501") return { ok: false, reason: "denied" };
    console.warn("[createTag]", error.code, error.message);
    return { ok: false, reason: "generic" };
  }
  return { ok: true, name };
}

/**
 * Nombres (name_es) de los temas activos, desde el cliente. Para el modal de
 * edición, que no recibe los tags del server. Devuelve [] si falla (el llamador
 * cae a la lista estática).
 */
export async function fetchTagNamesClient(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("name_es")
    .eq("active", true)
    .order("sort", { ascending: true });
  if (error || !data) return [];
  return data.map((t) => t.name_es as string).filter(Boolean);
}

/**
 * Temas actuales de un Flow (name_es), para preseleccionar en el modal de
 * edición. Tolerante: [] si falla.
 */
export async function fetchFlowTagNames(flowId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("flow_tags")
    .select("tags(name_es)")
    .eq("flow_id", flowId);
  if (error || !data) return [];
  return data
    .map((row: any) => row.tags?.name_es as string | undefined)
    .filter((n): n is string => !!n);
}
