import { createClient } from "@/lib/supabase/client";

// Escrituras de flows desde el cliente (como el usuario autenticado).
// La RLS (flows_update: author_id = auth.uid()) y los privilegios de columna
// (solo title/body_md/… — nunca contadores ni role) acotan todo.

export async function updateFlow(
  flowId: string,
  fields: { title: string; bodyMd: string },
): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("flows")
    .update({ title: fields.title.trim(), body_md: fields.bodyMd.trim() })
    .eq("id", flowId)
    .eq("author_id", user.id);
  return { ok: !error };
}
