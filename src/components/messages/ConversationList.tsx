"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { relativeTime } from "@/lib/format";
import type { ConversationSummary } from "@/data/messages";

function shortTime(iso: string | null, lang: "es" | "en"): string {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return relativeTime(mins, lang);
}

export function ConversationList({
  conversations,
  activeId,
  className,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  className?: string;
}) {
  const { t, lang } = useI18n();
  const { play } = useSound();
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter(
      (c) =>
        c.other.displayName.toLowerCase().includes(needle) ||
        c.other.username.toLowerCase().includes(needle),
    );
  }, [conversations, q]);

  return (
    <div className={cn("flex min-h-0 flex-col bg-surface-2", className)}>
      <div className="flex-none px-5 pb-3.5 pt-[22px]">
        <h1 className="mb-3.5 font-serif text-[24px] font-medium text-ink">
          {t("msg.title")}
        </h1>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("msg.search")}
            aria-label={t("msg.search")}
            className="w-full rounded-pill border border-line-2 bg-surface py-2.5 pl-10 pr-4 font-sans text-[14px] text-ink outline-none transition-colors focus:border-grana"
          />
        </div>
      </div>

      <div data-scroll className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 pb-20 lg:pb-4">
        {shown.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <p className="font-sans text-[14px] text-text-2">{t("msg.empty")}</p>
            <p className="mt-1 font-sans text-[13px] text-text-3">{t("msg.emptyHint")}</p>
          </div>
        ) : (
          shown.map((c) => (
            <Link
              key={c.id}
              href={`/mensajes/${c.id}`}
              onClick={() => play("click")}
              aria-current={c.id === activeId ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[14px] p-3 transition-colors duration-150",
                c.id === activeId ? "bg-surface-3" : "hover:bg-[var(--hover)]",
              )}
            >
              <Avatar name={c.other.displayName} src={c.other.avatarUrl} size={48} className="flex-none" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-sans text-[15px] font-semibold text-ink">
                    {c.other.displayName}
                  </span>
                  <span
                    suppressHydrationWarning
                    className="flex-none font-mono text-[11px] text-text-3"
                  >
                    {shortTime(c.lastMessageAt, lang)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate font-sans text-[13px] text-text-2">
                    {c.preview}
                  </span>
                  {c.unread > 0 && (
                    <span className="grid h-[18px] min-w-[18px] flex-none place-items-center rounded-pill bg-grana px-[5px] font-sans text-[11px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </span>
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
