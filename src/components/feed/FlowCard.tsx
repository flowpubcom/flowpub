"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar, AudioPlayer, Card } from "@/components/ui";
import { Cover } from "@/components/cover";
import { useSound } from "@/providers/SoundProvider";
import { useI18n } from "@/providers/I18nProvider";
import { compactNumber, durationLabel, relativeTime } from "@/lib/format";
import type { Flow } from "@/data/types";

// Badge sobre la portada (paleta fija: la portada no voltea con el tema).
const BADGE =
  "inline-flex items-center gap-1.5 rounded-pill bg-[rgba(251,250,246,0.92)] px-2.5 py-1 text-[#1A1714]";

export function FlowCard({ flow }: { flow: Flow }) {
  const { play } = useSound();
  const { t, lang } = useI18n();
  const [liked, setLiked] = useState(flow.liked);
  const [likes, setLikes] = useState(flow.likeCount);
  const [pop, setPop] = useState(false);

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    play(next ? "pop" : "soft");
    if (next) {
      setPop(true);
      window.setTimeout(() => setPop(false), 320);
    }
  };

  return (
    <Card hover padded={false} className="overflow-hidden">
      <Link
        href={`/flow/${flow.id}`}
        className="relative block"
        aria-label={flow.title}
      >
        <Cover kind={flow.coverKind} seed={flow.id} title={flow.title} />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className={cn(BADGE, "font-sans text-[12px] font-semibold")}>
            <span className="h-1.5 w-1.5 rounded-pill bg-grana" />
            {t("audio")}
          </span>
          <span className={cn(BADGE, "font-mono text-[12px]")}>
            {durationLabel(flow.durationSeconds)}
          </span>
        </div>
      </Link>

      <div className="p-6">
        <Link href={`/flow/${flow.id}`}>
          <h3 className="font-serif text-[24px] font-medium leading-[1.15] text-ink">
            {flow.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 font-serif text-[16px] leading-[1.5] text-text-2">
          {flow.excerpt}
        </p>

        <div className="mt-4">
          <AudioPlayer durationSeconds={flow.durationSeconds} />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <Link
            href={`/@${flow.author.username}`}
            className="flex min-w-0 items-center gap-2.5"
          >
            <Avatar
              name={flow.author.displayName}
              color={flow.author.avatarColor}
              size={34}
            />
            <span className="min-w-0">
              <span className="block truncate font-sans text-[14px] font-semibold text-ink">
                {flow.author.displayName}
              </span>
              <span className="block truncate font-sans text-[12px] text-text-3">
                {relativeTime(flow.ageMinutes, lang)} · {flow.tag}
              </span>
            </span>
          </Link>

          <div className="flex flex-none items-center gap-0.5">
            <button
              type="button"
              onClick={toggleLike}
              aria-pressed={liked}
              aria-label={t("like")}
              className={cn(
                "flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 font-sans text-[13px] transition-colors hover:bg-[var(--hover)]",
                liked ? "text-grana" : "text-text-2 hover:text-ink",
              )}
            >
              <Heart
                size={18}
                fill={liked ? "currentColor" : "none"}
                className={cn(pop && "[animation:fp-pop_.32s_var(--ease-flow)]")}
              />
              {compactNumber(likes)}
            </button>
            <button
              type="button"
              onClick={() => play("click")}
              aria-label={t("comment")}
              className="flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 font-sans text-[13px] text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
            >
              <MessageCircle size={18} />
              {compactNumber(flow.commentCount)}
            </button>
            <button
              type="button"
              onClick={() => play("click")}
              aria-label={t("share")}
              className="grid h-8 w-8 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
