import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "./types";

// Lecturas server-side de `/notificaciones`. Cada fila trae al actor (quien
// hizo la acción) y, según el tipo, el Flow y/o comentario relacionados.

export type NotificationType =
  | "like"
  | "follow"
  | "comment"
  | "voice"
  | "mention"
  | "flow";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  read: boolean;
  ageMinutes: number;
  actor: Profile | null;
  followingActor: boolean;
  flowId?: string;
  flowTitle?: string;
  flowCoverKind?: string;
  flowCoverUrl?: string | null;
  commentText?: string | null;
  commentAudioUrl?: string | null;
  commentDurationSeconds?: number;
  commentTranscript?: string | null;
}

function ageMinutesFrom(createdAt: string): number {
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.max(1, Math.round(ms / 60000));
}

const SELECT =
  "id,type,read,created_at," +
  "actor:profiles!actor_id(id,username,display_name,avatar_url)," +
  "flow:flows!flow_id(id,title,cover_kind,cover_url)," +
  "comment:comments!comment_id(kind,body_text,audio_url,duration_s,transcript_raw)";

/** Notificaciones del usuario con sesión (RLS ya acota a `user_id = auth.uid()`). */
export const fetchNotifications = cache(
  async (): Promise<{ items: NotificationItem[]; unreadCount: number }> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { items: [], unreadCount: 0 };

    const { data, error } = await supabase
      .from("notifications")
      .select(SELECT)
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) {
      console.error("[fetchNotifications]", error.message);
      return { items: [], unreadCount: 0 };
    }

    const rows = data ?? [];
    const actorIds = Array.from(
      new Set(
        rows
          .map((r: any) => r.actor?.id as string | undefined)
          .filter((id): id is string => !!id),
      ),
    );

    let followingSet = new Set<string>();
    if (actorIds.length) {
      const { data: follows } = await supabase
        .from("follows")
        .select("followee_id")
        .eq("follower_id", user.id)
        .in("followee_id", actorIds);
      followingSet = new Set((follows ?? []).map((f) => f.followee_id as string));
    }

    const items: NotificationItem[] = rows.map((r: any) => ({
      id: r.id,
      type: r.type as NotificationType,
      read: !!r.read,
      ageMinutes: ageMinutesFrom(r.created_at),
      actor: r.actor
        ? {
            id: r.actor.id,
            username: r.actor.username,
            displayName: r.actor.display_name || r.actor.username,
            avatarUrl: r.actor.avatar_url ?? null,
          }
        : null,
      followingActor: r.actor ? followingSet.has(r.actor.id) : false,
      flowId: r.flow?.id ?? undefined,
      flowTitle: r.flow?.title ?? undefined,
      flowCoverKind: r.flow?.cover_kind ?? undefined,
      flowCoverUrl: r.flow?.cover_url ?? null,
      commentText: r.comment?.kind === "text" ? r.comment.body_text : undefined,
      commentAudioUrl: r.comment?.kind === "voice" ? r.comment.audio_url : undefined,
      commentDurationSeconds: r.comment?.kind === "voice" ? r.comment.duration_s : undefined,
      commentTranscript: r.comment?.kind === "voice" ? r.comment.transcript_raw : undefined,
    }));

    const unreadCount = items.filter((i) => !i.read).length;
    return { items, unreadCount };
  },
);

