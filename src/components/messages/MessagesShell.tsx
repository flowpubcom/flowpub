"use client";

import { cn } from "@/lib/cn";
import { MessageCircle } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import type { ConversationSummary, DirectMessage } from "@/data/messages";
import type { Profile } from "@/data/types";

/** Shell de /mensajes: desktop dos-paneles (lista 340px + thread); móvil
 *  muestra la lista o —si hay conversación activa— el thread a pantalla
 *  completa (overlay fixed con su propio botón «Volver»). */
export function MessagesShell({
  conversations,
  activeId = null,
  active,
}: {
  conversations: ConversationSummary[];
  activeId?: string | null;
  active?: { other: Profile; messages: DirectMessage[] } | null;
}) {
  const { t } = useI18n();

  return (
    <div className="lg:flex lg:h-dvh">
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        className={cn(
          "h-dvh lg:h-auto lg:w-[340px] lg:flex-none lg:border-r lg:border-line",
          activeId ? "hidden lg:flex" : "flex",
        )}
      />

      {activeId && active ? (
        <div className="fixed inset-0 z-30 flex flex-col bg-surface lg:static lg:z-auto lg:flex-1">
          <MessageThread
            convId={activeId}
            other={active.other}
            initialMessages={active.messages}
          />
        </div>
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center gap-3 bg-surface lg:flex">
          <MessageCircle size={40} strokeWidth={1.4} className="text-text-3" />
          <p className="font-serif text-[18px] text-text-2">
            {t("msg.pickConversation")}
          </p>
        </div>
      )}
    </div>
  );
}
