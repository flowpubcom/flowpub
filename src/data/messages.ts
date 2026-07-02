import type { Profile } from "./types";

// Tipos puros de mensajería (los comparten server y cliente; sin next/headers).

export interface DirectMessage {
  id: string;
  senderId: string;
  kind: "text" | "voice";
  text?: string | null;
  audioUrl?: string | null;
  transcript?: string | null;
  durationSeconds?: number;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  other: Profile;
  /** Vista previa del último mensaje (texto o «Nota de voz»). */
  preview: string;
  lastMessageAt: string | null;
  unread: number;
}

// Sin embed de profiles: en el thread solo hace falta sender_id para distinguir
// míos/ajenos (el perfil del otro viene del meta de la conversación).
export const MESSAGE_SELECT =
  "id,sender_id,kind,body_text,audio_url,transcript_raw,duration_s,created_at";
// Cascada tolerante: si aún no corre migration_07 (sin duration_s).
export const MESSAGE_SELECT_LEGACY =
  "id,sender_id,kind,body_text,audio_url,transcript_raw,created_at";


export function mapMessageRow(r: any): DirectMessage {
  const kind = r.kind === "voice" ? "voice" : "text";
  return {
    id: r.id,
    senderId: r.sender_id,
    kind,
    text: kind === "text" ? (r.body_text ?? "") : null,
    audioUrl: kind === "voice" ? (r.audio_url ?? null) : null,
    transcript: kind === "voice" ? (r.transcript_raw ?? null) : null,
    durationSeconds: kind === "voice" ? (r.duration_s ?? 0) : undefined,
    createdAt: r.created_at,
  };
}
