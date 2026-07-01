import { createClient } from "@/lib/supabase/server";
import type { Comment } from "./comments";
import type { Profile } from "./types";

// Lectura server-side de comentarios de un Flow (RLS decide visibilidad).

const SEL =
  "id,kind,body_text,audio_url,transcript_raw,duration_s,like_count,created_at," +
  "author:profiles(id,username,display_name,avatar_url)";
// Cascada tolerante: si el esquema aún no tiene duration_s (migración 04
// pendiente), reintenta sin la columna.
const SEL_LEGACY =
  "id,kind,body_text,audio_url,transcript_raw,like_count,created_at," +
  "author:profiles(id,username,display_name,avatar_url)";

function ageMinutesFrom(createdAt: string | null): number {
  if (!createdAt) return 0;
  return Math.max(
    0,
    Math.round((Date.now() - new Date(createdAt).getTime()) / 60000),
  );
}

 
function mapComment(r: any): Comment | null {
  const a = r.author;
  if (!a) return null;
  const author: Profile = {
    id: a.id,
    username: a.username,
    displayName: a.display_name || a.username,
    avatarUrl: a.avatar_url ?? null,
  };
  const kind = r.kind === "voice" ? "voice" : "text";
  return {
    id: r.id,
    author,
    kind,
    text: kind === "text" ? (r.body_text ?? "") : undefined,
    audioUrl: kind === "voice" ? (r.audio_url ?? null) : undefined,
    audioDurationSeconds: kind === "voice" ? (r.duration_s ?? 0) : undefined,
    transcript: kind === "voice" ? (r.transcript_raw ?? undefined) : undefined,
    ageMinutes: ageMinutesFrom(r.created_at),
    likeCount: r.like_count ?? 0,
    liked: false,
  };
}

export async function fetchComments(flowId: string): Promise<Comment[]> {
  const supabase = await createClient();

  let { data, error } = await supabase
    .from("comments")
    .select(SEL)
    .eq("flow_id", flowId)
    .order("created_at", { ascending: false });
  if (error?.code === "42703") {
    ({ data, error } = await supabase
      .from("comments")
      .select(SEL_LEGACY)
      .eq("flow_id", flowId)
      .order("created_at", { ascending: false }));
  }
  if (error || !data) return [];

  const comments = data
    .map(mapComment)
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
