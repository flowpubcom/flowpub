"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";
import { useI18n } from "@/providers/I18nProvider";
import { useRadio } from "@/providers/RadioProvider";

export interface AudioPlayerProps {
  src?: string;
  durationSeconds: number;
  variant?: "mini" | "full";
  className?: string;
  /** Participa en la radio del Pub (requiere RadioProvider arriba y src). */
  radioId?: string;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Curva suave tipo vírgula (NO un waveform genérico). viewBox 0 0 300 26.
const VIRGULA =
  "M 2 13 C 34 1 58 25 92 13 C 126 1 150 25 184 13 C 218 1 242 25 276 13 C 288 9 296 11 298 13";

const RATES = [1, 1.5, 2] as const;

/** Reproductor firma: la línea-vírgula avanza en grana vía stroke-dashoffset. */
export function AudioPlayer({
  src,
  durationSeconds,
  variant = "mini",
  className,
  radioId,
}: AudioPlayerProps) {
  const { play: blip } = useSound();
  const { t } = useI18n();
  const radio = useRadio();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const baseRef = useRef(0);
  const elapsedRef = useRef(0);
  const rateRef = useRef(1);
  const epochRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rate, setRate] = useState<(typeof RATES)[number]>(1);

  const total = durationSeconds || 1;
  const progress = Math.min(1, elapsed / total);
  const isFull = variant === "full";
  const onAir = !!radio && !!radioId && !!src;

  // Modo mock (sin src): anima con rAF; respeta prefers-reduced-motion.
  useEffect(() => {
    if (src || !playing) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    startRef.current = performance.now();
    const tick = (now: number) => {
      const e =
        baseRef.current + ((now - startRef.current) / 1000) * rateRef.current;
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

  // Velocidad: al audio real siempre; en mock, dobla el avance del rAF.
  useEffect(() => {
    rateRef.current = rate;
    const a = audioRef.current;
    if (a) a.playbackRate = rate;
    if (!src && playing) {
      // Reancla el reloj mock para que el cambio no salte el progreso.
      baseRef.current = elapsedRef.current;
      startRef.current = performance.now();
    }
  }, [rate, src, playing]);

  // Radio: si otra voz toma el aire, esta se pausa.
  useEffect(() => {
    if (!onAir || !radio) return;
    if (radio.activeId !== radioId && playing) {
      audioRef.current?.pause();
      setPlaying(false);
    }
  }, [radio?.activeId]);

  // Radio: cuando la radio avanza hasta este Flow, arranca solo.
  useEffect(() => {
    if (!onAir || !radio) return;
    if (radio.activeId === radioId && radio.epoch !== epochRef.current) {
      epochRef.current = radio.epoch;
      const a = audioRef.current;
      if (!a) return;
      a.playbackRate = rateRef.current;
      void a
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          /* política de autoplay: se queda en pausa, sin romper nada */
        });
    }
  }, [radio?.activeId, radio?.epoch]);

  const toggle = () => {
    blip("click");
    if (src) {
      const a = audioRef.current;
      if (!a) return;
      if (playing) {
        a.pause();
        setPlaying(false);
      } else {
        a.playbackRate = rateRef.current;
        if (onAir && radioId) radio?.claim(radioId);
        void a
          .play()
          .then(() => setPlaying(true))
          .catch(() => {});
      }
      return;
    }
    if (elapsed >= total) {
      baseRef.current = 0;
      elapsedRef.current = 0;
      setElapsed(0);
    }
    setPlaying((p) => !p);
  };

  const cycleRate = () => {
    blip("tick");
    setRate((r) => RATES[(RATES.indexOf(r) + 1) % RATES.length]);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-[12px] rounded-pill border border-line bg-surface-2 py-[7px] pl-[7px] pr-[10px]",
        isFull && "w-full",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t("pause") : t("play")}
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
        className={cn("h-[26px]", isFull ? "w-full min-w-0 flex-1" : "w-[124px]")}
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

      <button
        type="button"
        onClick={cycleRate}
        aria-label={t("player.speed")}
        className={cn(
          "h-[30px] flex-none rounded-pill px-2 font-mono text-[11px] tabular-nums transition-colors duration-150 ease-flow hover:bg-[var(--hover)]",
          rate === 1 ? "text-text-3 hover:text-ink" : "font-bold text-ink",
        )}
      >
        {rate}×
      </button>

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
            if (onAir && radioId) radio?.ended(radioId);
          }}
        />
      )}
    </div>
  );
}
