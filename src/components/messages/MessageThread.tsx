"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { markConversationRead } from "@/data/messagesClient";
import { useConversationMessages } from "./useConversationMessages";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import type { DirectMessage } from "@/data/messages";
import type { Profile } from "@/data/types";

export function MessageThread({
  convId,
  other,
  initialMessages,
}: {
  convId: string;
  other: Profile;
  initialMessages: DirectMessage[];
}) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { play } = useSound();
  const router = useRouter();
  const { messages, append } = useConversationMessages(convId, initialMessages);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Autoscroll al fondo con cada mensaje nuevo.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Marca leído al abrir y cuando llega algo nuevo estando aquí.
  useEffect(() => {
    void markConversationRead(convId);
  }, [convId, messages.length]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-surface">
      {/* header */}
      <header className="flex flex-none items-center gap-3 border-b border-line-soft px-[18px] py-[14px]">
        <button
          type="button"
          onClick={() => {
            play("soft");
            router.push("/mensajes");
          }}
          aria-label={t("msg.back")}
          className="fp-hit grid h-[34px] w-[34px] flex-none place-items-center rounded-pill bg-surface-2 text-ink transition-colors hover:bg-[var(--hover)] lg:hidden"
        >
          <ArrowLeft size={18} />
        </button>
        <Link href={`/@${other.username}`} className="flex min-w-0 items-center gap-3">
          <Avatar name={other.displayName} src={other.avatarUrl} size={42} />
          <span className="min-w-0">
            <span className="block truncate font-sans text-[15px] font-semibold text-ink">
              {other.displayName}
            </span>
            <span className="block truncate font-sans text-[12px] text-text-2">
              @{other.username}
            </span>
          </span>
        </Link>
      </header>

      {/* mensajes */}
      <div
        ref={scrollRef}
        data-scroll
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-[26px] py-[22px]"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} mine={m.senderId === user?.id} />
        ))}
      </div>

      <MessageComposer convId={convId} onSend={append} />
    </div>
  );
}
