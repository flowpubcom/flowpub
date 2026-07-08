import { createClient } from "@/lib/supabase/client";

// Acciones del panel de control (cliente, como el admin autenticado).
// La RLS manda: flows_update/tags_admin/settings_admin exigen is_admin().

type Result = { ok: boolean };

export type FlowModStatus = "published" | "featured" | "hidden";

export async function setFlowStatus(
  flowId: string,
  status: FlowModStatus,
): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase
    .from("flows")
    .update({ status })
    .eq("id", flowId);
  return { ok: !error };
}

export async function setTagActive(
  tagId: number,
  active: boolean,
): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tags")
    .update({ active })
    .eq("id", tagId);
  return { ok: !error };
}

export async function addTag(
  nameEs: string,
  nameEn: string,
): Promise<Result> {
  const supabase = createClient();
  const slug = nameEs
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (!slug) return { ok: false };
  const { count } = await supabase
    .from("tags")
    .select("id", { count: "exact", head: true });
  // OJO: el grant de columna (migration_17) solo deja escribir slug/name_es/
  // name_en/sort; `active` cae al default true. Por eso no lo mandamos aquí.
  const { error } = await supabase.from("tags").insert({
    slug,
    name_es: nameEs.trim(),
    name_en: (nameEn.trim() || nameEs.trim()),
    sort: (count ?? 12) + 1,
  });
  return { ok: !error };
}

/** Actualiza una key de settings mezclando el parche sobre el jsonb actual. */
export async function saveSetting(
  key: string,
  patch: Record<string, unknown>,
): Promise<Result> {
  const supabase = createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  const value = { ...((data?.value as Record<string, unknown>) ?? {}), ...patch };
  const { error } = await supabase
    .from("settings")
    .update({ value })
    .eq("key", key);
  return { ok: !error };
}
