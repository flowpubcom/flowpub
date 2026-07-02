import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  MESSAGE_SELECT,
  MESSAGE_SELECT_LEGACY,
  mapMessageRow,
  type ConversationSummary,
  type DirectMessage,
} from "./messages";
import type { Profile } from "./types";

// Lecturas server-side de mensajería. RLS (is_member) decide todo; aquí solo
// se arma la bandeja y el thread. Tolerante a que migration_07 aún no corra.

function previewOf(kind: string, body: string | null, voiceLabel: string): string {
  if (kind === "voice") return voiceLabel;
  const t = (body ?? "").replace(/\s+/g, " ").trim();
  return t.length > 60 ? `${t.slice(0, 60)}…` : t;
}

/** Bandeja del usuario con sesión: una fila por conversación, con el otro
 *  integrante, la vista previa del último mensaje y el conteo de no leídos. */
export const fetchConversations = cache(
  async (voiceLabel = "Nota de voz"): Promise<ConversationSummary[]> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    // 1) Mis membresías (+ last_read_at si existe la columna).
    const memRes = await supabase
      .from("conversation_members")
      .select("conversation_id,last_read_at")
      .eq("user_id", user.id);
    let memData: any[] = memRes.data ?? [];
    if (memRes.error?.code === "42703") {
      const legacy = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);
      memData = legacy.data ?? [];
    } else if (memRes.error) {
      return [];
    }
    if (!memData.length) return [];

    const convIds = memData.map((m) => m.conversation_id as string);
    const readAt = new Map<string, string>();
    for (const m of memData) {
      if (m.last_read_at) readAt.set(m.conversation_id as string, m.last_read_at as string);
    }

    // 2) El OTRO integrante de cada conversación (+ su perfil).
    const { data: others } = await supabase
      .from("conversation_members")
      .select("conversation_id,profile:profiles!user_id(id,username,display_name,avatar_url)")
      .in("conversation_id", convIds)
      .neq("user_id", user.id);
    const otherByConv = new Map<string, Profile>();
    for (const row of others ?? []) {
      const p = (row as any).profile;
      if (p && !otherByConv.has(row.conversation_id as string)) {
        otherByConv.set(row.conversation_id as string, {
          id: p.id,
          username: p.username,
          displayName: p.display_name || p.username,
          avatarUrl: p.avatar_url ?? null,
        });
      }
    }

    // 3) Mensajes de esas conversaciones (para preview + no leídos). Beta:
    //    tope defensivo; una consulta y se agrega en memoria.
    const { data: msgs } = await supabase
      .from("messages")
      .select("id,conversation_id,sender_id,kind,body_text,created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false })
      .limit(500);

    const last = new Map<string, any>();
    const unread = new Map<string, number>();
    for (const m of msgs ?? []) {
      const cid = m.conversation_id as string;
      if (!last.has(cid)) last.set(cid, m);
      const r = readAt.get(cid);
      const isUnread =
        m.sender_id !== user.id && (!r || (m.created_at as string) > r);
      if (isUnread) unread.set(cid, (unread.get(cid) ?? 0) + 1);
    }

    const summaries: ConversationSummary[] = convIds
      .map((cid) => {
        const other = otherByConv.get(cid);
        if (!other) return null; // conversación sin el otro perfil visible
        const lm = last.get(cid);
        return {
          id: cid,
          other,
          preview: lm ? previewOf(lm.kind, lm.body_text, voiceLabel) : "",
          lastMessageAt: (lm?.created_at as string | undefined) ?? null,
          unread: unread.get(cid) ?? 0,
        };
      })
      .filter((c): c is ConversationSummary => c !== null)
      .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));

    return summaries;
  },
);

/** Perfil del otro integrante (encabezado del thread) + gate de membresía. */
export const fetchConversationMeta = cache(
  async (convId: string): Promise<{ other: Profile } | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("conversation_members")
      .select("user_id,profile:profiles!user_id(id,username,display_name,avatar_url)")
      .eq("conversation_id", convId);
    if (!data?.length) return null; // RLS: no soy integrante → vacío

    const iAmMember = data.some((r) => r.user_id === user.id);
    if (!iAmMember) return null;

    const otherRow = data.find((r) => r.user_id !== user.id);
    const p = (otherRow as any)?.profile;
    if (!p) return null;
    return {
      other: {
        id: p.id,
        username: p.username,
        displayName: p.display_name || p.username,
        avatarUrl: p.avatar_url ?? null,
      },
    };
  },
);

/** Mensajes de una conversación, cronológico. RLS exige ser integrante. */
export const fetchMessages = cache(
  async (convId: string): Promise<DirectMessage[]> => {
    const supabase = await createClient();
    const res = await supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    let rows: any[] = res.data ?? [];
    if (res.error?.code === "42703") {
      const legacy = await supabase
        .from("messages")
        .select(MESSAGE_SELECT_LEGACY)
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      rows = legacy.data ?? [];
    } else if (res.error) {
      return [];
    }
    return rows.map(mapMessageRow);
  },
);
