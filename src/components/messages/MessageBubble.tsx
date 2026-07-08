"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";
import { useI18n } from "@/providers/I18nProvider";
import { resolveMessageAudio } from "@/data/storage";
import type { DirectMessage } from "@/data/messages";

// Curva vírgula del reproductor de voz (compacta, viewBox 0 0 130 22).
const WAVE =
  "M 3 11 C 35 3 60 19 100 11 C 116 7 124 13 127 11";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** Reproductor compacto para burbuja de voz. `out` = saliente (tinta). */
function VoicePlayer({
  src,
  durationSeconds,
  out,
}: {
  src?: string | null;
  durationSeconds: number;
  out: boolean;
}) {
  const { play: blip } = useSound();
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const total = durationSeconds || 1;
  const progress = Math.min(1, elapsed / total);

  // El audio privado llega como PATH del bucket `messages`: se firma por 1h.
  // Las URLs completas (legacy del bucket público) pasan directo.
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(
    src && /^https?:\/\//.test(src) ? src : null,
  );
  useEffect(() => {
    if (!src) return;
    if (/^https?:\/\//.test(src)) {
      setResolvedSrc(src);
      return;
    }
    let alive = true;
    void resolveMessageAudio(src).then((u) => {
      if (alive) setResolvedSrc(u);
    });
    return () => {
      alive = false;
    };
  }, [src]);

  const toggle = () => {
    blip("click");
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      void a.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t("pause") : t("play")}
        className={cn(
          "fp-hit grid h-[34px] w-[34px] flex-none place-items-center rounded-pill transition-transform duration-150 ease-flow active:scale-[.94]",
          out ? "bg-ink-on text-ink" : "bg-ink text-ink-on",
        )}
      >
        {playing ? (
          <Pause size={13} fill="currentColor" />
        ) : (
          <Play size={13} fill="currentColor" className="ml-[1px]" />
        )}
      </button>
      <svg viewBox="0 0 130 22" fill="none" className="h-[22px] w-[130px]" aria-hidden>
        <path
          d={WAVE}
          stroke="var(--ink-on)"
          strokeOpacity={out ? 0.4 : 0}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {!out && (
          <path d={WAVE} stroke="var(--wave)" strokeWidth={2} strokeLinecap="round" />
        )}
        <path
          d={WAVE}
          stroke={out ? "var(--ink-on)" : "var(--grana)"}
          strokeWidth={2}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
        />
      </svg>
      <span
        className={cn(
          "flex-none font-mono text-[12px] tabular-nums",
          out ? "text-ink-on opacity-85" : "text-text-2",
        )}
      >
        {fmt(playing || elapsed ? elapsed : total)}
      </span>
      {resolvedSrc && (
        <audio
          ref={audioRef}
          src={resolvedSrc}
          preload="metadata"
          className="hidden"
          onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
          onEnded={() => {
            setPlaying(false);
            setElapsed(0);
          }}
        />
      )}
    </div>
  );
}

export function MessageBubble({ message, mine }: { message: DirectMessage; mine: boolean }) {
  const { play } = useSound();
  const { t } = useI18n();
  const [showT, setShowT] = useState(false);
  const isVoice = message.kind === "voice";

  return (
    <div
      className={cn(
        "flex max-w-[80%] flex-col [animation:fp-rise_.24s_var(--ease-flow)]",
        mine ? "self-end items-end" : "self-start items-start",
      )}
    >
      <div
        className={cn(
          "px-[14px] py-[10px] text-[14.5px] leading-[1.45]",
          isVoice && "px-[12px] py-[9px]",
          mine
            ? "rounded-[18px_18px_5px_18px] bg-ink text-ink-on"
            : "rounded-[18px_18px_18px_5px] border border-line-soft bg-surface-2 text-ink",
        )}
      >
        {isVoice ? (
          <VoicePlayer
            src={message.audioUrl}
            durationSeconds={message.durationSeconds ?? 0}
            out={mine}
          />
        ) : (
          <span className="whitespace-pre-wrap break-words font-sans">{message.text}</span>
        )}

        {isVoice && message.transcript && (
          <>
            <button
              type="button"
              onClick={() => {
                play("tick");
                setShowT((v) => !v);
              }}
              aria-expanded={showT}
              className={cn(
                "mt-[7px] flex items-center gap-1.5 font-sans text-[12px] font-semibold transition-opacity hover:opacity-80",
                mine ? "text-ink-on opacity-80" : "text-text-2",
              )}
            >
              <ChevronDown
                size={13}
                className={cn("transition-transform duration-150", showT && "rotate-180")}
              />
              {t("view_transcript")}
            </button>
            {showT && (
              <p
                className={cn(
                  "mt-1.5 max-w-[280px] font-serif text-[13.5px] leading-[1.5] [animation:fp-fade_.2s_ease-out]",
                  mine ? "text-ink-on opacity-90" : "text-text-2",
                )}
              >
                {message.transcript}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
