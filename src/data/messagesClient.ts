import { createClient } from "@/lib/supabase/client";
import { uploadVoiceMessage } from "./storage";
import { mapMessageRow, type DirectMessage } from "./messages";

// Escritura de mensajería desde el navegador (como el usuario autenticado).

export type DmResult =
  | { ok: true; id: string }
  | { ok: false; error: "no-session" | "no-migration" | "generic" };

/** Halla o crea el DM 1:1 con `otherId` (RPC atómico). Devuelve el id. */
export async function getOrCreateDm(otherId: string): Promise<DmResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "no-session" };

  const { data, error } = await supabase.rpc("get_or_create_dm", {
    other: otherId,
  });
  if (error) {
    // 42883 = la función no existe aún (migration_07 pendiente).
    if (error.code === "42883" || /function/i.test(error.message)) {
      return { ok: false, error: "no-migration" };
    }
    return { ok: false, error: "generic" };
  }
  return { ok: true, id: data as string };
}

export type SendResult =
  | { ok: true; message: DirectMessage }
  | { ok: false; error: "no-session" | "transcribe" | "generic" };

export async function sendTextMessage(
  convId: string,
  body: string,
): Promise<SendResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "no-session" };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: convId,
      sender_id: user.id,
      kind: "text",
      body_text: body.trim(),
    })
    .select("id,sender_id,kind,body_text,audio_url,transcript_raw,created_at")
    .single();
  if (error || !data) return { ok: false, error: "generic" };
  return { ok: true, message: mapMessageRow(data) };
}

/** Mensaje de voz: sube audio + transcribe (Gemini) + inserta. Igual que un
 *  comentario de voz: se guarda el audio Y el transcript sin pulir. */
export async function sendVoiceMessage(
  convId: string,
  blob: Blob,
  durationSeconds: number,
): Promise<SendResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "no-session" };

  const form = new FormData();
  form.append("audio", blob);

  // Privacidad: la nota de voz va al bucket privado `messages` (path firmable),
  // no al público de los Flows. `audio_url` guarda el PATH (o URL legacy).
  const [audioUrl, transcript] = await Promise.all([
    uploadVoiceMessage(blob, convId).catch(() => null),
    fetch("/api/transcribe", { method: "POST", body: form })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (typeof j?.transcript === "string" ? j.transcript.trim() : ""))
      .catch(() => ""),
  ]);

  if (!transcript) return { ok: false, error: "transcribe" };
  // Si la subida del audio falló, NO insertamos: un mensaje de voz sin audio_url
  // quedaría mudo para siempre. Mejor avisar del error y que reintente.
  if (!audioUrl) return { ok: false, error: "generic" };

  const base = {
    conversation_id: convId,
    sender_id: user.id,
    kind: "voice",
    audio_url: audioUrl,
    transcript_raw: transcript,
  };
  const sel =
    "id,sender_id,kind,body_text,audio_url,transcript_raw,duration_s,created_at";
  // Cascada tolerante: sin duration_s (migration_07 pendiente), reintenta.
  let { data, error } = await supabase
    .from("messages")
    .insert({ ...base, duration_s: Math.max(1, Math.round(durationSeconds)) })
    .select(sel)
    .single();
  if (error?.code === "PGRST204" || error?.code === "42703") {
    ({ data, error } = await supabase
      .from("messages")
      .insert(base)
      .select("id,sender_id,kind,body_text,audio_url,transcript_raw,created_at")
      .single());
  }
  if (error || !data) return { ok: false, error: "generic" };
  return { ok: true, message: mapMessageRow(data) };
}

/** Marca la conversación como leída hasta ahora (badge de no leídos). */
export async function markConversationRead(convId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", convId)
    .eq("user_id", user.id);
}
