"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AudioPlayer, Avatar, Button } from "@/components/ui";
import { Cover } from "@/components/cover";
import { FlowProse } from "@/components/compose/FlowProse";
import { useSound } from "@/providers/SoundProvider";
import { useI18n } from "@/providers/I18nProvider";
import { compactNumber, durationLabel, relativeTime } from "@/lib/format";
import type { Flow } from "@/data/types";
import type { Comment } from "@/data/comments";
import { CommentComposer } from "./CommentComposer";
import { CommentItem } from "./CommentItem";

export function FlowReader({
  flow,
  initialComments,
}: {
  flow: Flow;
  initialComments: Comment[];
}) {
  const { play } = useSound();
  const { t, lang } = useI18n();

  const [view, setView] = useState<"pub" | "raw">("pub");
  const [liked, setLiked] = useState(flow.liked);
  const [likes, setLikes] = useState(flow.likeCount);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const body = flow.bodyMd ?? `## ${flow.title}\n\n${flow.excerpt}`;
  const transcript = flow.transcriptRaw ?? flow.excerpt;

  const toggleLike = () => {
    const n = !liked;
    setLiked(n);
    setLikes((x) => x + (n ? 1 : -1));
    play(n ? "pop" : "soft");
  };

  const post = (c: Comment) => {
    setComments((prev) => [c, ...prev]);
    setNewIds((prev) => new Set(prev).add(c.id));
  };

  return (
    <div className="min-h-dvh">
      {/* top bar */}
      <header className="glass sticky top-0 z-20 flex items-center justify-between border-b border-line-soft px-4 py-3">
        <Link
          href="/"
          aria-label="Volver al Pub"
          className="grid h-9 w-9 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="font-sans text-[13px] font-semibold text-text-2">Flow</span>
        <button
          type="button"
          onClick={() => play("click")}
          aria-label={t("share")}
          className="grid h-9 w-9 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
        >
          <Share2 size={18} />
        </button>
      </header>

      <article className="mx-auto max-w-[720px] px-5 pb-28 pt-8 lg:pb-16">
        {/* kicker → hub del tema (link interno: SEO + descubrimiento) */}
        <div className="mb-4 flex flex-wrap gap-2">
          {flow.tagSlug ? (
            <Link
              href={`/tema/${flow.tagSlug}`}
              className="rounded-pill bg-grana-wash px-3 py-1 font-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-grana-700 transition-transform duration-150 ease-flow hover:scale-[1.03]"
            >
              {flow.tag}
            </Link>
          ) : (
            <span className="rounded-pill bg-grana-wash px-3 py-1 font-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-grana-700">
              {flow.tag}
            </span>
          )}
        </div>

        <h1 className="font-serif text-[clamp(30px,5vw,46px)] font-normal leading-[1.08] tracking-[-0.02em] text-ink">
          {flow.title}
        </h1>

        {/* byline */}
        <div className="mt-5 flex items-center justify-between gap-3 border-b border-line pb-5">
          <Link href={`/@${flow.author.username}`} className="flex min-w-0 items-center gap-3">
            <Avatar
              name={flow.author.displayName}
              color={flow.author.avatarColor}
              size={44}
            />
            <span className="min-w-0">
              <span className="block font-sans text-[15px] font-semibold text-ink">
                {flow.author.displayName}
              </span>
              <span className="block font-sans text-[12px] text-text-3">
                {relativeTime(flow.ageMinutes, lang)} · {durationLabel(flow.durationSeconds)} de audio
              </span>
            </span>
          </Link>
          <button
            type="button"
            aria-pressed={following}
            onClick={() => {
              const n = !following;
              setFollowing(n);
              play(n ? "pop" : "soft");
            }}
            className={cn(
              "flex-none rounded-pill border px-5 py-2 font-sans text-[13px] font-semibold transition-colors duration-150 ease-flow",
              following
                ? "border-ink bg-ink text-ink-on"
                : "border-ink text-ink hover:bg-ink hover:text-ink-on",
            )}
          >
            {following ? t("following") : t("follow")}
          </button>
        </div>

        {/* portada */}
        <div className="mt-6 overflow-hidden rounded-card border border-line">
          <Cover kind={flow.coverKind} seed={flow.id} title={flow.title} />
        </div>

        {/* audio */}
        <div className="mt-5">
          <AudioPlayer
            src={flow.audioUrl ?? undefined}
            durationSeconds={flow.durationSeconds}
            variant="full"
          />
        </div>

        {/* toggle publicación / transcript */}
        <div className="mt-7 inline-flex rounded-pill border border-line bg-surface-2 p-[3px]">
          {(
            [
              ["pub", "Publicación"],
              ["raw", "Transcript original"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => {
                setView(v);
                play("tick");
              }}
              className={cn(
                "rounded-pill px-4 py-1.5 font-sans text-[13px] font-semibold transition-colors duration-150",
                view === v
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(26,23,20,.08)]"
                  : "text-text-3 hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* cuerpo */}
        <div className="mt-6">
          {view === "pub" ? (
            <FlowProse source={body} />
          ) : (
            <div>
              <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
                Transcript · sin pulir
              </p>
              <p className="whitespace-pre-wrap font-serif text-[17px] leading-[1.7] text-text-2">
                {transcript}
              </p>
            </div>
          )}
        </div>

        {/* engagement */}
        <div className="mt-8 flex items-center gap-1 border-y border-line py-3">
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            aria-label={t("like")}
            className={cn(
              "flex items-center gap-2 rounded-pill px-3 py-2 font-sans text-[14px] transition-colors hover:bg-[var(--hover)]",
              liked ? "text-grana" : "text-text-2 hover:text-ink",
            )}
          >
            <Heart size={19} fill={liked ? "currentColor" : "none"} />
            {compactNumber(likes)}
          </button>
          <span className="flex items-center gap-2 rounded-pill px-3 py-2 font-sans text-[14px] text-text-2">
            <MessageCircle size={19} />
            {comments.length}
          </span>
          <button
            type="button"
            onClick={() => play("click")}
            aria-label={t("share")}
            className="ml-auto grid h-9 w-9 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              setSaved((s) => !s);
              play(saved ? "soft" : "pop");
            }}
            aria-pressed={saved}
            aria-label={t("save")}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-pill transition-colors hover:bg-[var(--hover)]",
              saved ? "text-grana" : "text-text-2 hover:text-ink",
            )}
          >
            <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>

        {/* comentarios */}
        <section className="mt-10">
          <h2 className="mb-5 font-serif text-[22px] font-medium text-ink">
            Comentarios{" "}
            <span className="font-mono text-[15px] text-text-3">
              {comments.length}
            </span>
          </h2>

          <CommentComposer flowId={flow.id} onPost={post} />

          <div className="mt-7 flex flex-col gap-6">
            {comments.length === 0 ? (
              <p className="py-8 text-center font-sans text-[14px] text-text-3">
                Sé la primera voz en responder.
              </p>
            ) : (
              comments.map((c) => (
                <CommentItem key={c.id} comment={c} isNew={newIds.has(c.id)} />
              ))
            )}
          </div>
        </section>
      </article>
    </div>
  );
}
