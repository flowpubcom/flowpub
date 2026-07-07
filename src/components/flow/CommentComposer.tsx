"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, Send, Square } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";
import { useSound } from "@/providers/SoundProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useI18n } from "@/providers/I18nProvider";
import { useRecorder } from "@/lib/useRecorder";
import { postTextComment, postVoiceComment } from "@/data/commentsClient";
import { formatDuration } from "@/lib/format";
import type { Comment } from "@/data/comments";

// Un comentario de voz es breve: hasta minuto y medio.
const MAX_VOICE = 90;

const WAVE = ["bg-grana", "bg-ocre", "bg-grana", "bg-ink", "bg-grana", "bg-ocre", "bg-grana"];

function MiniWave() {
  return (
    <div className="flex h-8 items-center gap-1" aria-hidden>
      {WAVE.map((c, i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-pill", c)}
          style={{
            height: 24,
            transformOrigin: "center",
            animation: `fp-bar 1s ease-in-out ${i * 0.1}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function CommentComposer({
  flowId,
  onPost,
}: {
  flowId: string;
  onPost: (c: Comment) => void;
}) {
  const { play } = useSound();
  const { user } = useAuth();
  const { t } = useI18n();
  const recorder = useRecorder(MAX_VOICE);
  const [tab, setTab] = useState<"text" | "voice">("text");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "processing">("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const stopAndPost = async () => {
    const result = await recorder.stop();
    if (!result) {
      setVoiceState("idle");
      play("soft");
      return;
    }
    setVoiceState("processing");
    const res = await postVoiceComment(flowId, result.blob, result.durationSeconds);
    if (!res.ok) {
      setVoiceState("idle");
      setVoiceError(
        res.error === "transcribe" ? t("msg.voiceError") : t("onb.err.generic"),
      );
      play("soft");
      return;
    }
    play("pop");
    onPost({
      id: res.id,
      author: {
        id: user!.id,
        username: user!.username,
        displayName: user!.displayName,
        avatarColor: user!.avatarColor,
        avatarUrl: user!.avatarUrl,
      },
      kind: "voice",
      audioUrl: res.audioUrl,
      audioDurationSeconds: Math.max(1, Math.round(result.durationSeconds)),
      transcript: res.transcript,
      ageMinutes: 0,
      likeCount: 0,
      liked: false,
    });
    setVoiceState("idle");
  };

  // Tope duro: al llegar al máximo, se detiene y publica solo.
  useEffect(() => {
    if (voiceState === "recording" && recorder.elapsed >= MAX_VOICE) {
      void stopAndPost();
    }
     
  }, [recorder.elapsed, voiceState]);

  // Solo con sesión se comenta (RLS lo exige). Invitado → compuerta a /entrar.
  if (!user) {
    return (
      <div className="rounded-[16px] border border-line bg-surface-2 p-5 text-center">
        <p className="font-sans text-[14px] text-text-2">
          {t("comment.gate.prefix")}{" "}
          <Link href="/entrar" className="font-semibold text-grana-text">
            {t("comment.gate.link")}
          </Link>
          .
        </p>
      </div>
    );
  }

  const sendText = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const res = await postTextComment(flowId, body);
    setSending(false);
    if (!res.ok) {
      play("soft");
      return;
    }
    play("pop");
    onPost({
      id: res.id,
      author: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        avatarUrl: user.avatarUrl,
      },
      kind: "text",
      text: body,
      ageMinutes: 0,
      likeCount: 0,
      liked: false,
    });
    setText("");
  };

  const startVoice = async () => {
    setVoiceError(null);
    play("rec");
    const ok = await recorder.start();
    if (ok) setVoiceState("recording");
  };

  return (
    <div className="rounded-[16px] border border-line bg-surface p-4">
      <div className="mb-3 inline-flex rounded-pill bg-surface-2 p-[3px]">
        {(["text", "voice"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={tab === v}
            onClick={() => {
              setTab(v);
              play("tick");
            }}
            className={cn(
              "rounded-pill px-3.5 py-1 font-sans text-[12px] font-semibold transition-colors duration-150",
              tab === v
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(26,23,20,.08)]"
                : "text-text-3 hover:text-ink",
            )}
          >
            {t(v === "text" ? "comment.tab.text" : "comment.tab.voice")}
          </button>
        ))}
      </div>

      {tab === "text" ? (
        <div className="flex items-end gap-2">
          <Avatar
            name={user.displayName}
            src={user.avatarUrl}
            color={user.avatarColor}
            size={34}
            className="flex-none"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder={t("comment.placeholder")}
            aria-label={t("comment.aria")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendText();
              }
            }}
            className="min-h-[40px] flex-1 resize-none rounded-[12px] border border-line bg-surface-2 px-3 py-2 font-sans text-[15px] text-ink outline-none focus:border-grana"
          />
          <button
            type="button"
            onClick={() => void sendText()}
            disabled={!text.trim() || sending}
            aria-label={t("msg.send")}
            className="grid h-10 w-10 flex-none place-items-center rounded-pill bg-grana text-white transition-transform duration-150 ease-flow active:scale-[.95] disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      ) : (
        <div className="flex min-h-[40px] flex-col gap-2">
          {voiceState === "idle" && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void startVoice()}
                className="inline-flex items-center gap-2 rounded-pill bg-grana px-4 py-2.5 font-sans text-[14px] font-semibold text-white transition-transform duration-150 ease-flow active:scale-[.97]"
              >
                <Mic size={16} />
                {t("comment.record")}
              </button>
              <span className="font-mono text-[12px] text-text-3">
                {t("comment.max", { t: formatDuration(MAX_VOICE) })}
              </span>
            </div>
          )}

          {voiceState === "recording" && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 font-mono text-[14px] tabular-nums text-grana-text">
                <span className="h-2 w-2 animate-pulse rounded-pill bg-grana" />
                {formatDuration(recorder.elapsed)}
              </span>
              <div className="flex-1">
                <MiniWave />
              </div>
              <button
                type="button"
                onClick={() => void stopAndPost()}
                aria-label={t("comment.stop")}
                className="grid h-10 w-10 flex-none place-items-center rounded-pill bg-grana text-white transition-transform duration-150 ease-flow active:scale-[.94]"
              >
                <Square size={16} fill="currentColor" />
              </button>
            </div>
          )}

          {voiceState === "processing" && (
            <p role="status" className="px-1 py-2 font-sans text-[14px] text-text-2">
              {t("comment.transcribing")}
            </p>
          )}

          {(voiceError || recorder.error) && (
            <p role="status" className="px-1 font-sans text-[13px] text-grana-text">
              {voiceError ?? recorder.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
