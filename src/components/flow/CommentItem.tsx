"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Heart, Reply } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar, AudioPlayer } from "@/components/ui";
import { useSound } from "@/providers/SoundProvider";
import { useI18n } from "@/providers/I18nProvider";
import { useAuth } from "@/providers/AuthProvider";
import { setCommentLike } from "@/data/engagement";
import { relativeTime } from "@/lib/format";
import type { Comment } from "@/data/comments";

export function CommentItem({
  comment,
  isNew,
}: {
  comment: Comment;
  isNew?: boolean;
}) {
  const { play } = useSound();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(comment.liked);
  const [likes, setLikes] = useState(comment.likeCount);
  const [showT, setShowT] = useState(false);

  const toggleLike = async () => {
    if (!user) {
      play("soft");
      router.push("/entrar");
      return;
    }
    const n = !liked;
    setLiked(n);
    setLikes((x) => x + (n ? 1 : -1));
    play(n ? "pop" : "soft");
    const res = await setCommentLike(comment.id, n);
    if (!res.ok) {
      setLiked(!n);
      setLikes((x) => x + (n ? -1 : 1));
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3",
        isNew && "[animation:fp-rise_.32s_var(--ease-flow)]",
      )}
    >
      <Avatar
        name={comment.author.displayName}
        color={comment.author.avatarColor}
        size={36}
        className="mt-0.5 flex-none"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-[14px] font-semibold text-ink">
            {comment.author.displayName}
          </span>
          <span className="font-sans text-[12px] text-text-2">
            {relativeTime(comment.ageMinutes, lang)}
          </span>
        </div>

        {comment.kind === "text" ? (
          <p className="mt-1 font-serif text-[16px] leading-[1.5] text-ink">
            {comment.text}
          </p>
        ) : (
          <div className="mt-2">
            <AudioPlayer
              src={comment.audioUrl ?? undefined}
              durationSeconds={comment.audioDurationSeconds ?? 0}
            />
            <button
              type="button"
              onClick={() => setShowT((v) => !v)}
              aria-expanded={showT}
              className="fp-hit-y mt-2 flex items-center gap-1.5 font-sans text-[12px] font-medium text-text-2 transition-colors hover:text-ink"
            >
              <ChevronDown
                size={14}
                className={cn("transition-transform duration-150", showT && "rotate-180")}
              />
              {t("view_transcript")}
            </button>
            {showT && (
              <p className="mt-1.5 rounded-[10px] border border-line bg-surface-2 p-3 font-serif text-[14px] leading-[1.5] text-text-2">
                {comment.transcript}
              </p>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center gap-1">
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            aria-label={t("like")}
            className={cn(
              "fp-hit-y flex items-center gap-1.5 rounded-pill px-2 py-1 font-sans text-[12px] transition-colors hover:bg-[var(--hover)]",
              liked ? "text-grana" : "text-text-2 hover:text-ink",
            )}
          >
            <Heart size={14} fill={liked ? "currentColor" : "none"} />
            {likes > 0 ? likes : ""}
          </button>
          <button
            type="button"
            onClick={() => play("click")}
            className="fp-hit-y flex items-center gap-1.5 rounded-pill px-2 py-1 font-sans text-[12px] text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
          >
            <Reply size={14} />
            {t("comment.reply")}
          </button>
        </div>
      </div>
    </div>
  );
}
