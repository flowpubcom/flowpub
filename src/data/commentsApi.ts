import { createClient } from "@/lib/supabase/server";
import type { Comment } from "./comments";
import type { Profile } from "./types";

// Lectura server-side de comentarios de un Flow (RLS decide visibilidad).

function ageMinutesFrom(createdAt: string | null): number {
  if (!createdAt) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
}

function mapComment(r: {
  id: string;
  kind: string;
  body_text: string | null;
  transcript_raw: string | null;
  like_count: number | null;
  created_at: string;
  author:
    | { id: string; username: string; display_name: string | null; avatar_url: string | null }
    | null;
}): Comment | null {
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
    transcript: kind === "voice" ? (r.transcript_raw ?? undefined) : undefined,
    ageMinutes: ageMinutesFrom(r.created_at),
    likeCount: r.like_count ?? 0,
    liked: false,
  };
}

export async function fetchComments(flowId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      "id,kind,body_text,transcript_raw,like_count,created_at,author:profiles(id,username,display_name,avatar_url)",
    )
    .eq("flow_id", flowId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data
    .map((r) => mapComment(r as unknown as Parameters<typeof mapComment>[0]))
    .filter((c): c is Comment => c !== null);
}
