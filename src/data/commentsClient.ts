import { createClient } from "@/lib/supabase/client";

// Escritura de comentarios desde el cliente (como el usuario autenticado).
// Los de voz llegan con Gemini + Storage; por ahora solo texto.

export type PostCommentResult =
  | { ok: true; id: string }
  | { ok: false; error: "no-session" | "generic" };

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
