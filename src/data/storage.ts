import { createClient } from "@/lib/supabase/client";

// Subida de audio al bucket `audio`. La RLS exige que el primer segmento de la
// ruta sea el uid del usuario (<uid>/archivo). Devuelve la URL pública o null.

function extFromMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4") || mime.includes("m4a")) return "mp4";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  return "webm";
}

/** Sube una imagen de portada al bucket `covers` (carpeta uid, per RLS). */
export async function uploadCover(file: File): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/cover-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("covers").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return null;

  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAudio(blob: Blob): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ext = extFromMime(blob.type || "audio/webm");
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("audio").upload(path, blob, {
    contentType: blob.type || "audio/webm",
    upsert: false,
  });
  if (error) return null;

  const { data } = supabase.storage.from("audio").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Nota de voz de DM: bucket PRIVADO `messages` (path <convId>/<uid>/...).
 * Devuelve el PATH (no URL); se reproduce vía signed URL (resolveMessageAudio).
 * Cascada tolerante: si el bucket no existe aún (migration_16 pendiente), cae
 * al bucket público `audio` y devuelve su URL completa para no romper los DMs.
 */
export async function uploadVoiceMessage(
  blob: Blob,
  convId: string,
): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ext = extFromMime(blob.type || "audio/webm");
  const path = `${convId}/${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("messages").upload(path, blob, {
    contentType: blob.type || "audio/webm",
    upsert: false,
  });
  if (!error) return path;

  console.warn(
    "[uploadVoiceMessage] bucket privado no disponible (¿migration_16?); usando el público:",
    error.message,
  );
  return uploadAudio(blob);
}

/**
 * Resuelve el src de un audio de mensaje: una URL completa (legacy, bucket
 * público) pasa tal cual; un path del bucket privado se firma por 1 hora.
 */
export async function resolveMessageAudio(
  pathOrUrl: string,
): Promise<string | null> {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("messages")
    .createSignedUrl(pathOrUrl, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}
