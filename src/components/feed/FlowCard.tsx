"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronUp, Heart, MessageCircle, PenLine, Share2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar, AudioPlayer, Card } from "@/components/ui";
import { FlowCover } from "@/components/cover";
import { FlowProse } from "@/components/compose/FlowProse";
import { CommentComposer } from "@/components/flow/CommentComposer";
import { CommentItem } from "@/components/flow/CommentItem";
import { FlowEditModal } from "@/components/flow/FlowEditModal";
import { useSound } from "@/providers/SoundProvider";
import { useI18n } from "@/providers/I18nProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useRadio } from "@/providers/RadioProvider";
import { setFlowLike, shareFlow } from "@/data/engagement";
import { fetchCommentsClient } from "@/data/commentsClient";
import {
  compactNumber,
  durationLabel,
  excerptOf,
  relativeTime,
} from "@/lib/format";
import type { Flow } from "@/data/types";
import type { Comment } from "@/data/comments";

// Badge sobre la portada (etiqueta fija tipo sticker: legible sobre ambas
// variantes de portada, clara y oscura).
const BADGE =
  "inline-flex items-center gap-1.5 rounded-pill bg-[rgba(251,250,246,0.92)] px-2.5 py-1 text-[#1A1714]";

export function FlowCard({ flow }: { flow: Flow }) {
  const { play } = useSound();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const radio = useRadio();
  const [liked, setLiked] = useState(flow.liked);
  const [likes, setLikes] = useState(flow.likeCount);
  const [pop, setPop] = useState(false);

  // La lectura vive aquí mismo: extracto → artículo completo, sin salir del Pub.
  const [title, setTitle] = useState(flow.title);
  const [body, setBody] = useState(flow.bodyMd ?? flow.excerpt);
  const [excerpt, setExcerpt] = useState(flow.excerpt);
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const proseId = useId();
  const commentsId = useId();
  // Al expandir/colapsar, el botón enfocado se desmonta y el foco caería a
  // <body>; lo devolvemos al control gemelo (solo tras un toggle del usuario).
  const readRef = useRef<HTMLButtonElement | null>(null);
  const lessRef = useRef<HTMLButtonElement | null>(null);
  const userToggled = useRef(false);

  // Comentarios inline: se cargan la primera vez que se abren.
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentCount, setCommentCount] = useState(flow.commentCount);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const isOwn = user?.id === flow.author.id;

  // Optimista con revert: pinta ya, persiste atrás, revierte si falla.
  const toggleLike = async () => {
    if (!user) {
      play("soft");
      router.push("/entrar");
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    play(next ? "pop" : "soft");
    if (next) {
      setPop(true);
      window.setTimeout(() => setPop(false), 320);
    }
    const res = await setFlowLike(flow.id, next);
    if (!res.ok) {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    }
  };

  const onShare = async () => {
    const out = await shareFlow(title, `/flow/${flow.id}`);
    play(out === "failed" ? "soft" : "pop");
  };

  const toggleExpanded = () => {
    play("tick");
    userToggled.current = true;
    setExpanded((v) => !v);
  };

  useEffect(() => {
    if (!userToggled.current) return;
    userToggled.current = false;
    if (document.activeElement === document.body) {
      (expanded ? lessRef : readRef).current?.focus();
    }
  }, [expanded]);

  const toggleComments = async () => {
    play("tick");
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    if (opening && comments === null) {
      const loaded = await fetchCommentsClient(flow.id);
      if (!loaded) return; // falló la carga: se reintenta al reabrir
      // Mergea con lo publicado mientras cargaba (dedup por id) — el SELECT
      // pudo correr antes que el INSERT del propio usuario.
      setComments((prev) => {
        if (!prev) return loaded;
        const seen = new Set(loaded.map((c) => c.id));
        return [...prev.filter((c) => !seen.has(c.id)), ...loaded];
      });
      setCommentCount((n) => Math.max(n, loaded.length));
    }
  };

  const postComment = (c: Comment) => {
    setComments((prev) => [c, ...(prev ?? [])]);
    setCommentCount((n) => n + 1);
    setNewIds((prev) => new Set(prev).add(c.id));
  };

  return (
    <Card
      hover
      padded={false}
      className="overflow-hidden"
      ref={(el: HTMLDivElement | null) => {
        if (flow.audioUrl) radio?.registerCard(flow.id, el);
      }}
    >
      <Link
        href={`/flow/${flow.id}`}
        className="relative block"
        aria-label={title}
      >
        <FlowCover coverUrl={flow.coverUrl} kind={flow.coverKind} seed={flow.id} title={title} />
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
            {title}
          </h3>
        </Link>

        {/* extracto → artículo completo ahí mismo (Flow, baby) */}
        {expanded ? (
          <div id={proseId} className="[animation:fp-rise_.24s_var(--ease-flow)]">
            <FlowProse source={body} className="mt-3" demoteHeadings />
            <div className="mt-2 flex items-center gap-3">
              <button
                ref={lessRef}
                type="button"
                onClick={toggleExpanded}
                aria-expanded={expanded}
                aria-controls={proseId}
                className="flex items-center gap-1 rounded-pill px-2 py-1 font-sans text-[13px] font-semibold text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
              >
                <ChevronUp size={14} />
                {t("pub.showLess")}
              </button>
              <Link
                href={`/flow/${flow.id}`}
                className="font-sans text-[13px] font-medium text-text-3 transition-colors hover:text-ink"
              >
                {t("pub.openFlow")}
              </Link>
            </div>
          </div>
        ) : (
          <button
            ref={readRef}
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-controls={proseId}
            className="group/read mt-2 block w-full cursor-pointer text-left"
          >
            <span className="line-clamp-2 block font-serif text-[16px] leading-[1.5] text-text-2">
              {excerpt}
            </span>
            <span className="mt-1 inline-block font-sans text-[12px] font-semibold text-text-3 transition-colors group-hover/read:text-ink">
              {t("pub.readHere")}
            </span>
          </button>
        )}

        <div className="mt-4">
          <AudioPlayer
            src={flow.audioUrl ?? undefined}
            durationSeconds={flow.durationSeconds}
            variant="full"
            radioId={flow.audioUrl ? flow.id : undefined}
          />
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
            {isOwn && (
              <button
                type="button"
                onClick={() => {
                  play("click");
                  setEditOpen(true);
                }}
                aria-label={t("flow.edit")}
                title={t("flow.edit")}
                className="grid h-8 w-8 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
              >
                <PenLine size={17} />
              </button>
            )}
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
              onClick={() => void toggleComments()}
              aria-expanded={commentsOpen}
              aria-controls={commentsId}
              aria-label={t("comment")}
              className={cn(
                "flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 font-sans text-[13px] transition-colors hover:bg-[var(--hover)]",
                commentsOpen ? "text-ink" : "text-text-2 hover:text-ink",
              )}
            >
              <MessageCircle
                size={18}
                fill={commentsOpen ? "currentColor" : "none"}
              />
              {compactNumber(commentCount)}
            </button>
            <button
              type="button"
              onClick={onShare}
              aria-label={t("share")}
              className="grid h-8 w-8 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* comentarios inline: leer y sumar la voz sin salir del Pub */}
        {commentsOpen && (
          <div
            id={commentsId}
            className="mt-5 border-t border-line pt-5 [animation:fp-rise_.24s_var(--ease-flow)]"
          >
            <CommentComposer flowId={flow.id} onPost={postComment} />
            <div className="mt-5 flex flex-col gap-5">
              {comments === null ? (
                <p
                  role="status"
                  className="py-4 text-center font-sans text-[13px] text-text-3"
                >
                  {t("comments.loading")}
                </p>
              ) : comments.length === 0 ? (
                <p className="py-4 text-center font-sans text-[13px] text-text-3">
                  {t("comments.empty")}
                </p>
              ) : (
                comments.map((c) => (
                  <CommentItem key={c.id} comment={c} isNew={newIds.has(c.id)} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {isOwn && (
        <FlowEditModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          flowId={flow.id}
          initialTitle={title}
          initialBody={body}
          onSaved={(newTitle, newBody) => {
            setTitle(newTitle);
            setBody(newBody);
            setExcerpt(excerptOf(newBody));
            setEditOpen(false);
            router.refresh();
          }}
        />
      )}
    </Card>
  );
}
