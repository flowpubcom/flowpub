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
