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
