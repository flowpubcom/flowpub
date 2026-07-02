import { ines, maria, tomas } from "./mock";
import type { Profile } from "./types";

export interface Comment {
  id: string;
  author: Profile;
  kind: "text" | "voice";
  /** Texto del comentario (text) o transcript visible del de voz. */
  text?: string;
  audioUrl?: string | null;
  audioDurationSeconds?: number;
  /** Transcript crudo del comentario de voz (sin pulir, per spec). */
  transcript?: string;
  ageMinutes: number;
  likeCount: number;
  liked: boolean;
}

// ── Mapeo compartido fila→Comment (server y cliente leen igual) ─────────────

// Hint !author_id: desambigua comments↔profiles (likes crea otro camino).
export const COMMENT_SELECT =
  "id,kind,body_text,audio_url,transcript_raw,duration_s,like_count,created_at," +
  "author:profiles!author_id(id,username,display_name,avatar_url)";
// Cascada tolerante: si el esquema aún no tiene duration_s (migración 04
// pendiente), reintenta sin la columna.
export const COMMENT_SELECT_LEGACY =
  "id,kind,body_text,audio_url,transcript_raw,like_count,created_at," +
  "author:profiles!author_id(id,username,display_name,avatar_url)";

function ageMinutesFrom(createdAt: string | null): number {
  if (!createdAt) return 0;
  return Math.max(
    0,
    Math.round((Date.now() - new Date(createdAt).getTime()) / 60000),
  );
}

export function mapCommentRow(r: any): Comment | null {
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

// Persona de la sesión front-first (al comentar). Auth real la reemplaza.
export const GUEST: Profile = {
  id: "me",
  username: "tu",
  displayName: "Tú",
  avatarColor: "grana",
};

const SEED: Record<string, Comment[]> = {
  f1: [
    {
      id: "c1",
      author: maria,
      kind: "text",
      text: "Me quedé pensando en eso de que el audio guarda las pausas. Nunca lo había escuchado así.",
      ageMinutes: 90,
      likeCount: 12,
      liked: false,
    },
    {
      id: "c2",
      author: tomas,
      kind: "voice",
      audioDurationSeconds: 34,
      transcript:
        "sí, totalmente, a mí me pasa que cuando grabo me escucho dudar, y esas dudas también dicen algo, ¿no? como que el barro tiembla antes de tomar forma.",
      ageMinutes: 45,
      likeCount: 5,
      liked: false,
    },
    {
      id: "c3",
      author: ines,
      kind: "text",
      text: "«El barro como primer molde». Me lo llevo.",
      ageMinutes: 20,
      likeCount: 3,
      liked: false,
    },
  ],
};

export function commentsFor(flowId: string): Comment[] {
  return SEED[flowId] ?? [];
}
