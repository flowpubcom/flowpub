"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapMessageRow, type DirectMessage } from "@/data/messages";

/** Mensajes de una conversación con suscripción Realtime a los inserts.
 *  Arranca del server (initial) y agrega en vivo los que llegan del otro.
 *  Los propios se agregan optimistamente con `append` al enviar. */
export function useConversationMessages(
  convId: string,
  initial: DirectMessage[],
) {
  const [messages, setMessages] = useState<DirectMessage[]>(initial);
  const seen = useRef<Set<string>>(new Set(initial.map((m) => m.id)));

  // Al cambiar de conversación, rearranca desde el snapshot del server.
  useEffect(() => {
    setMessages(initial);
    seen.current = new Set(initial.map((m) => m.id));

  }, [convId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dm:${convId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const m = mapMessageRow(payload.new);
          if (seen.current.has(m.id)) return; // ya lo teníamos (envío propio)
          seen.current.add(m.id);
          setMessages((prev) => [...prev, m]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [convId]);

  /** Agrega un mensaje propio recién enviado (dedupe con el eco de Realtime). */
  const append = (m: DirectMessage) => {
    if (seen.current.has(m.id)) return;
    seen.current.add(m.id);
    setMessages((prev) => [...prev, m]);
  };

  return { messages, append };
}
