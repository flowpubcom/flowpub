import { createClient } from "@/lib/supabase/client";
import { uploadAudio } from "./storage";

// Escritura de comentarios desde el cliente (como el usuario autenticado).

export type PostCommentResult =
  | { ok: true; id: string }
  | { ok: false; error: "no-session" | "generic" };

export type PostVoiceResult =
  | { ok: true; id: string; audioUrl: string | null; transcript: string }
  | { ok: false; error: "no-session" | "transcribe" | "generic" };

export async function postTextComment(
  flowId: string,
  body: string,
): Promise<PostCommentResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "no-session" };

  const { data, error } = await supabase
    .from("comments")
    .insert({
      flow_id: flowId,
      author_id: user.id,
      kind: "text",
      body_text: body.trim(),
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "generic" };
  return { ok: true, id: data.id as string };
}

/** Comentario de voz: sube el audio + transcribe (Gemini) + inserta.
 *  Per spec: se guarda el audio Y el transcript SIN pulir. */
export async function postVoiceComment(
  flowId: string,
  blob: Blob,
  durationSeconds: number,
): Promise<PostVoiceResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "no-session" };

  const form = new FormData();
  form.append("audio", blob);

  const [audioUrl, transcript] = await Promise.all([
    uploadAudio(blob).catch(() => null),
    fetch("/api/transcribe", { method: "POST", body: form })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (typeof j?.transcript === "string" ? j.transcript.trim() : ""))
      .catch(() => ""),
  ]);

  // Sin transcript no hay comentario de voz (regla: siempre ofrece transcript).
  if (!transcript) return { ok: false, error: "transcribe" };

  const base = {
    flow_id: flowId,
    author_id: user.id,
    kind: "voice",
    audio_url: audioUrl,
    transcript_raw: transcript,
  };
  // Cascada tolerante: si el esquema aún no tiene duration_s (migración 04
  // pendiente), reintenta sin la columna.
  let { data, error } = await supabase
    .from("comments")
    .insert({ ...base, duration_s: Math.max(1, Math.round(durationSeconds)) })
    .select("id")
    .single();
  if (error?.code === "PGRST204" || error?.code === "42703") {
    ({ data, error } = await supabase
      .from("comments")
      .insert(base)
      .select("id")
      .single());
  }

  if (error || !data) return { ok: false, error: "generic" };
  return { ok: true, id: data.id as string, audioUrl, transcript };
}
