import { createClient } from "@/lib/supabase/client";
import type { CoverKind } from "@/lib/covers";

// Publicación de un Flow desde el composer (cliente, como el usuario autenticado;
// RLS: author_id == auth.uid()). El audio real + pulido con Gemini llegan luego;
// por ahora persiste el texto y el transcript (hoy simulado).

export type PublishResult =
  | { ok: true; id: string }
  | { ok: false; error: "no-session" | "generic" };

export async function publishFlow(input: {
  title: string;
  bodyMd: string;
  transcriptRaw?: string;
  coverKind: CoverKind;
  durationSeconds: number;
  tagNames: string[];
  audioUrl?: string | null;
  /** 'published' (default) o 'draft' («Guardar borrador»). */
  status?: "published" | "draft";
}): Promise<PublishResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "no-session" };

  const { data: flow, error } = await supabase
    .from("flows")
    .insert({
      author_id: user.id,
      title: input.title.trim() || "Sin título",
      body_md: input.bodyMd,
      transcript_raw: input.transcriptRaw ?? null,
      cover_kind: input.coverKind,
      audio_url: input.audioUrl ?? null,
      lang: "es",
      status: input.status ?? "published",
      duration_s: Math.round(input.durationSeconds),
    })
    .select("id")
    .single();

  if (error || !flow) return { ok: false, error: "generic" };

  // Mapea nombres de tema (name_es) → ids e inserta flow_tags (máx 3).
  // OJO: el Flow YA está publicado; si los tags fallan NO reportamos error
  // (el usuario reintentaría y duplicaría el Flow). Tags = secundarios.
  const names = input.tagNames.slice(0, 3);
  if (names.length) {
    const { data: tagRows, error: tagsErr } = await supabase
      .from("tags")
      .select("id,name_es")
      .in("name_es", names);
    if (tagsErr) console.warn("[publishFlow] tags:", tagsErr.message);
    const rows = (tagRows ?? []).map((t) => ({
      flow_id: flow.id as string,
      tag_id: t.id as number,
    }));
    if (rows.length) {
      const { error: ftErr } = await supabase.from("flow_tags").insert(rows);
      if (ftErr) console.warn("[publishFlow] flow_tags:", ftErr.message);
    }
  }

  return { ok: true, id: flow.id as string };
}
