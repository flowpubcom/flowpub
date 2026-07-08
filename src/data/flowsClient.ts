import { createClient } from "@/lib/supabase/client";
import type { CoverKind } from "@/lib/covers";

// Escrituras de flows desde el cliente (como el usuario autenticado).
// La RLS (flows_update: author_id = auth.uid()) y los privilegios de columna
// (solo title/body_md/cover_*/… — nunca contadores ni role) acotan todo.

export interface UpdateFlowFields {
  title: string;
  bodyMd: string;
  /** Presente = actualiza la portada. null = portada generativa (limpia la foto). */
  coverUrl?: string | null;
  /** Presente = actualiza la dirección de arte de la portada generativa. */
  coverKind?: CoverKind;
  /** Presente = reemplaza los temas del Flow (máx 3, por name_es). */
  tagNames?: string[];
}

export interface UpdateFlowResult {
  ok: boolean;
  /** El texto se guardó pero la portada no (faltan privilegios de columna: migración vieja). */
  coverDegraded?: boolean;
}

export async function updateFlow(
  flowId: string,
  fields: UpdateFlowFields,
): Promise<UpdateFlowResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // Texto siempre; portada solo si el llamador la mandó (coverUrl/coverKind).
  const base: Record<string, unknown> = {
    title: fields.title.trim(),
    body_md: fields.bodyMd.trim(),
  };
  const hasCover =
    fields.coverKind !== undefined || fields.coverUrl !== undefined;
  const withCover: Record<string, unknown> = { ...base };
  if (fields.coverKind !== undefined) withCover.cover_kind = fields.coverKind;
  if (fields.coverUrl !== undefined) withCover.cover_url = fields.coverUrl;

  let coverDegraded = false;
  let { error } = await supabase
    .from("flows")
    .update(withCover)
    .eq("id", flowId)
    .eq("author_id", user.id);

  // Cascada tolerante: sin el grant de columna de cover (migración vieja), el
  // update de esas columnas da 42501/PGRST204/42703. Reintenta guardando solo el
  // texto y avisa con un flag (no perdemos la edición del artículo por la portada).
  if (
    error &&
    hasCover &&
    (error.code === "42501" ||
      error.code === "PGRST204" ||
      error.code === "42703")
  ) {
    coverDegraded = true;
    ({ error } = await supabase
      .from("flows")
      .update(base)
      .eq("id", flowId)
      .eq("author_id", user.id));
  }
  if (error) return { ok: false };

  // Temas (secundarios): borra los del Flow + inserta los nuevos (máx 3, mapeando
  // name_es→id como en publishFlow). Si algo de tags falla NO bloquea el guardado
  // del resto (el texto/portada ya quedaron) — solo se registra con console.warn.
  if (fields.tagNames) {
    try {
      const { error: delErr } = await supabase
        .from("flow_tags")
        .delete()
        .eq("flow_id", flowId);
      if (delErr) console.warn("[updateFlow] flow_tags delete:", delErr.message);

      const names = fields.tagNames.slice(0, 3);
      if (names.length) {
        const { data: tagRows, error: tagsErr } = await supabase
          .from("tags")
          .select("id,name_es")
          .in("name_es", names);
        if (tagsErr) console.warn("[updateFlow] tags:", tagsErr.message);
        const rows = (tagRows ?? []).map((tg) => ({
          flow_id: flowId,
          tag_id: tg.id as number,
        }));
        if (rows.length) {
          const { error: insErr } = await supabase
            .from("flow_tags")
            .insert(rows);
          if (insErr) console.warn("[updateFlow] flow_tags insert:", insErr.message);
        }
      }
    } catch (e) {
      console.warn("[updateFlow] tags:", e);
    }
  }

  return { ok: true, coverDegraded };
}
