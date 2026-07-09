"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronUp, Heart, Lock, MessageCircle, PenLine, Share2 } from "lucide-react";
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
  "inline-flex items-center gap-1.5 rounded-pill bg-papel/90 px-2.5 py-1 text-tinta";

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
  const [commentsError, setCommentsError] = useState(false);
  const [commentCount, setCommentCount] = useState(flow.commentCount);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const isOwn = user?.id === flow.author.id;
  // Compuerta de edad: los Flows 18+ solo se escuchan con fecha de nacimiento
  // declarada y mayoría de edad. El autor siempre puede oír lo suyo.
  const canListen = !flow.adult || isOwn || (user?.isAdult ?? false);

  // Candado in-flight: ignora re-toques con la petición en vuelo, así el
  // insert/delete no llega fuera de orden y desincroniza BD vs UI.
  const likePending = useRef(false);

  // Optimista con revert: pinta ya, persiste atrás, revierte si falla.
  const toggleLike = async () => {
    if (!user) {
      play("soft");
      router.push("/entrar");
      return;
    }
    if (likePending.current) return;
    likePending.current = true;
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    play(next ? "pop" : "soft");
    if (next) {
      setPop(true);
      window.setTimeout(() => setPop(false), 320);
    }
    try {
      const res = await setFlowLike(flow.id, next);
      if (!res.ok) {
        setLiked(!next);
        setLikes((n) => n + (next ? -1 : 1));
      }
    } finally {
      likePending.current = false;
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

  const loadComments = async () => {
    setCommentsError(false);
    const loaded = await fetchCommentsClient(flow.id);
    if (!loaded) {
      // Falló la carga: se avisa con reintento (nada de «Cargando…» eterno).
      setCommentsError(true);
      return;
    }
    // Mergea con lo publicado mientras cargaba (dedup por id) — el SELECT
    // pudo correr antes que el INSERT del propio usuario.
    setComments((prev) => {
      if (!prev) return loaded;
      const seen = new Set(loaded.map((c) => c.id));
      return [...prev.filter((c) => !seen.has(c.id)), ...loaded];
    });
    setCommentCount((n) => Math.max(n, loaded.length));
  };

  const toggleComments = () => {
    play("tick");
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    if (opening && comments === null) void loadComments();
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
        if (flow.audioUrl && canListen) radio?.registerCard(flow.id, el);
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
          {flow.adult && (
            <span className={cn(BADGE, "font-mono text-[12px] font-bold")}>18+</span>
          )}
          {flow.explicitLang && (
            <span className={cn(BADGE, "font-sans text-[11px] font-semibold uppercase tracking-[0.04em]")}>
              {t("flow.explicit")}
            </span>
          )}
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
                className="font-sans text-[13px] font-medium text-text-2 transition-colors hover:text-ink"
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
            <span className="mt-1 inline-block font-sans text-[12px] font-semibold text-text-2 transition-colors group-hover/read:text-ink">
              {t("pub.readHere")}
            </span>
          </button>
        )}

        <div className="mt-4">
          {canListen ? (
            <AudioPlayer
              src={flow.audioUrl ?? undefined}
              durationSeconds={flow.durationSeconds}
              variant="full"
              radioId={flow.audioUrl ? flow.id : undefined}
            />
          ) : (
            <AdultGateNotice hasUser={!!user} hasBirthdate={!!user?.birthdate} />
          )}
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
              <span className="block truncate font-sans text-[12px] text-text-2">
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
                className="fp-hit-y grid h-9 w-9 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
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
                "fp-hit-y flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 font-sans text-[13px] transition-colors hover:bg-[var(--hover)]",
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
                "fp-hit-y flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 font-sans text-[13px] transition-colors hover:bg-[var(--hover)]",
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
              className="fp-hit-y grid h-9 w-9 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
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
                commentsError ? (
                  <div className="py-4 text-center">
                    <p className="font-sans text-[13px] text-text-2">
                      {t("comments.error")}
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadComments()}
                      className="mt-2 rounded-pill border border-line-2 px-4 py-1.5 font-sans text-[13px] font-medium text-ink transition-colors hover:bg-[var(--hover)]"
                    >
                      {t("comments.retry")}
                    </button>
                  </div>
                ) : (
                  <p
                    role="status"
                    className="py-4 text-center font-sans text-[13px] text-text-2"
                  >
                    {t("comments.loading")}
                  </p>
                )
              ) : comments.length === 0 ? (
                <p className="py-4 text-center font-sans text-[13px] text-text-2">
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
          initialCoverUrl={flow.coverUrl}
          initialCoverKind={flow.coverKind}
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

/** Aviso de la compuerta 18+: quién eres decide el siguiente paso. */
function AdultGateNotice({
  hasUser,
  hasBirthdate,
}: {
  hasUser: boolean;
  hasBirthdate: boolean;
}) {
  const { t } = useI18n();
  const hint = !hasUser
    ? t("flow.adultHintGuest")
    : hasBirthdate
      ? t("flow.adultHintMinor")
      : t("flow.adultHintNoBirthdate");
  const href = !hasUser ? "/entrar" : hasBirthdate ? null : "/perfil";
  const body = (
    <div className="flex items-center gap-3 rounded-[14px] border border-line bg-surface-2 px-4 py-3">
      <Lock size={16} className="flex-none text-text-3" aria-hidden />
      <p className="font-sans text-[13px] leading-snug text-text-2">
        <span className="font-semibold text-ink">{t("flow.adultOnly")}</span>{" "}
        {hint}
      </p>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-85">
      {body}
    </Link>
  ) : (
    body
  );
}
