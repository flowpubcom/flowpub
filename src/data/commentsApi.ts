import { createClient } from "@/lib/supabase/server";
import {
  COMMENT_SELECT,
  COMMENT_SELECT_LEGACY,
  mapCommentRow,
  type Comment,
} from "./comments";

// Lectura server-side de comentarios de un Flow (RLS decide visibilidad).
// El select y el mapeo viven en comments.ts (compartidos con el cliente).

export async function fetchComments(flowId: string): Promise<Comment[]> {
  const supabase = await createClient();

  let { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("flow_id", flowId)
    .order("created_at", { ascending: false });
  if (error?.code === "42703") {
    ({ data, error } = await supabase
      .from("comments")
      .select(COMMENT_SELECT_LEGACY)
      .eq("flow_id", flowId)
      .order("created_at", { ascending: false }));
  }
  if (error || !data) return [];

  const comments = data
    .map(mapCommentRow)
    .filter((c): c is Comment => c !== null);

  // liked del lector actual (si hay sesión)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && comments.length) {
    const { data: myLikes } = await supabase
      .from("likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", comments.map((c) => c.id));
    const likedSet = new Set((myLikes ?? []).map((l) => l.comment_id as string));
    for (const c of comments) c.liked = likedSet.has(c.id);
  }

  return comments;
}
