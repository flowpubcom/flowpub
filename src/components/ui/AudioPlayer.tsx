"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";

export interface AudioPlayerProps {
  src?: string;
  durationSeconds: number;
  variant?: "mini" | "full";
  className?: string;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Curva suave tipo vírgula (NO un waveform genérico). viewBox 0 0 300 26.
const VIRGULA =
  "M 2 13 C 34 1 58 25 92 13 C 126 1 150 25 184 13 C 218 1 242 25 276 13 C 288 9 296 11 298 13";

/** Reproductor firma: la línea-vírgula avanza en grana vía stroke-dashoffset. */
export function AudioPlayer({
  src,
  durationSeconds,
  variant = "mini",
  className,
}: AudioPlayerProps) {
  const { play: blip } = useSound();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const baseRef = useRef(0);
  const elapsedRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const total = durationSeconds || 1;
  const progress = Math.min(1, elapsed / total);
  const isFull = variant === "full";

  // Modo mock (sin src): anima con rAF; respeta prefers-reduced-motion.
  useEffect(() => {
    if (src || !playing) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    startRef.current = performance.now();
    const tick = (now: number) => {
      const e = baseRef.current + (now - startRef.current) / 1000;
      if (e >= total) {
        elapsedRef.current = total;
        setElapsed(total);
        setPlaying(false);
        baseRef.current = 0;
        return;
      }
      elapsedRef.current = e;
      setElapsed(e);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      baseRef.current = elapsedRef.current;
    };
  }, [playing, src, total]);

  const toggle = () => {
    blip("click");
    if (src) {
      const a = audioRef.current;
      if (!a) return;
      if (playing) a.pause();
      else void a.play();
      setPlaying((p) => !p);
      return;
    }
    if (elapsed >= total) {
      baseRef.current = 0;
      elapsedRef.current = 0;
      setElapsed(0);
    }
    setPlaying((p) => !p);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-[14px] rounded-pill border border-line bg-surface-2 py-[7px] pl-[7px] pr-[14px]",
        isFull && "w-full",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar" : "Reproducir"}
        className="grid h-[38px] w-[38px] flex-none place-items-center rounded-pill bg-ink text-ink-on transition-transform duration-150 ease-flow active:scale-[.94]"
      >
        {playing ? (
          <Pause size={16} fill="currentColor" />
        ) : (
          <Play size={16} fill="currentColor" className="ml-[1px]" />
        )}
      </button>

      <svg
        viewBox="0 0 300 26"
        fill="none"
        preserveAspectRatio="none"
        className={cn("h-[26px]", isFull ? "w-full min-w-0 flex-1" : "w-[160px]")}
        aria-hidden="true"
      >
        <path d={VIRGULA} stroke="var(--wave)" strokeWidth={2.4} strokeLinecap="round" />
        <path
          d={VIRGULA}
          stroke="var(--grana)"
          strokeWidth={2.4}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
        />
      </svg>

      <span className="flex-none font-mono text-[12px] tabular-nums text-text-2">
        {isFull ? `${formatTime(elapsed)} / ${formatTime(total)}` : formatTime(total)}
      </span>

      {src && (
        <audio
          ref={audioRef}
          src={src}
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
