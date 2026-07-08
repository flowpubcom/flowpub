"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { FlowMark, Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/chrome/ThemeToggle";
import { useTheme } from "@/providers/ThemeProvider";
import { useSound } from "@/providers/SoundProvider";
import { SLIDES, TIERS, ASK, BASE_BREAKDOWN, FINANCE_NOTES, type Slide, type Visual } from "./data";
import {
  AskVisual,
  BraidVisual,
  BrandVisual,
  ClosingVisual,
  FeaturesVisual,
  FounderVisual,
  GenerativeVisual,
  KaraokeVisual,
  NoiseVisual,
  OpeningVisual,
  PipelineVisual,
  RecordVisual,
  StateVisual,
} from "./visuals";

type VP = { theme: "light" | "dark"; active: boolean };
const VISUALS: Partial<Record<Visual, (p: VP) => ReactNode>> = {
  opening: OpeningVisual,
  noise: NoiseVisual,
  karaoke: KaraokeVisual,
  record: RecordVisual,
  pipeline: PipelineVisual,
  features: FeaturesVisual,
  brand: BrandVisual,
  generative: GenerativeVisual,
  state: StateVisual,
  founder: FounderVisual,
  braid: BraidVisual,
  ask: AskVisual,
  closing: ClosingVisual,
};

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p
      className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-grana-text"
      style={{ animation: "fp-rise .5s var(--ease-flow) both" }}
    >
      {children}
    </p>
  );
}

function TextBlock({ slide, center }: { slide: Slide; center?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-5", center && "items-center text-center")}>
      <Kicker>{slide.kicker}</Kicker>
      <h2
        className="max-w-[18ch] font-serif text-[clamp(2rem,4.6vw,3.6rem)] font-medium leading-[1.06] tracking-[-0.01em] text-ink"
        style={{ animation: "fp-rise .5s var(--ease-flow) 80ms both" }}
      >
        {slide.title}
      </h2>
      {slide.body && (
        <p
          className={cn(
            "max-w-[56ch] font-sans text-[clamp(1rem,1.5vw,1.2rem)] leading-relaxed text-text-2",
            center && "mx-auto",
          )}
          style={{ animation: "fp-rise .5s var(--ease-flow) 160ms both" }}
        >
          {slide.body}
        </p>
      )}
      {slide.bullets.length > 0 && (
        <ul
          className={cn("mt-1 flex flex-col gap-2.5", center && "items-center")}
          style={{ animation: "fp-rise .5s var(--ease-flow) 240ms both" }}
        >
          {slide.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 font-sans text-[15px] text-ink">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-pill bg-grana" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FinanceSlide({ slide }: { slide: Slide }) {
  const max = Math.max(...BASE_BREAKDOWN.map((b) => b.usd));
  return (
    <div
      data-deck-scroll
      className="mx-auto flex h-full w-full max-w-[1120px] flex-col gap-6 overflow-y-auto px-6 py-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>{slide.kicker}</Kicker>
          <h2 className="mt-2 font-serif text-[clamp(1.8rem,3.4vw,2.8rem)] font-medium tracking-[-0.01em] text-ink">
            {slide.title}
          </h2>
        </div>
        <div className="rounded-card border border-grana/30 bg-grana-wash px-5 py-3 text-right">
          <p className="font-serif text-[2rem] font-medium leading-none text-ink">
            ${ASK.amountUsd.toLocaleString("en-US")}<span className="ml-1 font-mono text-[13px] text-text-2">USD</span>
          </p>
          <p className="mt-1 font-mono text-[12px] text-text-2">
            ≈ ${ASK.mxn.toLocaleString("es-MX")} MXN · {ASK.months} meses
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={cn(
              "flex flex-col rounded-card border p-5",
              t.recommended ? "border-grana bg-surface shadow-[var(--shadow-glow)]" : "border-line bg-surface/70",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-[15px] font-semibold text-ink">{t.name}</span>
              {t.recommended && (
                <span className="rounded-pill bg-grana px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide text-white">
                  Recomendado
                </span>
              )}
            </div>
            <p className="mt-3 font-serif text-[1.9rem] font-medium leading-none text-ink">
              ${t.annualUsd.toLocaleString("en-US")}
              <span className="ml-1 font-mono text-[12px] text-text-3">/año</span>
            </p>
            <p className="mt-1 font-mono text-[12px] text-text-2">
              ${t.monthlyUsd.toLocaleString("en-US")}/mes
            </p>
            <p className="mt-3 font-sans text-[13px] leading-relaxed text-text-2">{t.summary}</p>
          </div>
        ))}
      </div>

      <div className="rounded-card border border-line bg-surface/60 p-5">
        <p className="mb-4 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-text-2">
          En qué se va · escenario Base, al año
        </p>
        <div className="flex flex-col gap-3">
          {BASE_BREAKDOWN.map((b) => (
            <div key={b.label} className="flex items-center gap-4">
              <span className="w-[46%] flex-none font-sans text-[13px] text-ink">{b.label}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-pill bg-surface-3">
                <span
                  className={cn("block h-full rounded-pill", b.kind === "growth" ? "bg-grana" : "bg-ocre")}
                  style={{ width: `${Math.max(4, (b.usd / max) * 100)}%` }}
                />
              </div>
              <span className="w-[74px] flex-none text-right font-mono text-[12px] text-text-2">
                ${b.usd.toLocaleString("en-US")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {FINANCE_NOTES.map((n) => (
          <p key={n} className="rounded-lg border border-line bg-surface/50 px-3 py-2 font-sans text-[12px] leading-snug text-text-2">
            {n}
          </p>
        ))}
      </div>
    </div>
  );
}

function SlideView({ slide, theme, active }: { slide: Slide; theme: "light" | "dark"; active: boolean }) {
  if (slide.visual === "finance") return <FinanceSlide slide={slide} />;
  const Visual = VISUALS[slide.visual];
  const visual = Visual ? <Visual theme={theme} active={active} /> : null;

  if (slide.layout === "center") {
    return (
      <div className="mx-auto flex h-full w-full max-w-[900px] flex-col items-center justify-center gap-10 px-6 text-center">
        <div className="h-[34vh] w-full">{visual}</div>
        <TextBlock slide={slide} center />
      </div>
    );
  }
  return (
    <div className="mx-auto grid h-full w-full max-w-[1180px] items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
      <TextBlock slide={slide} />
      <div className="min-h-[38vh] lg:h-[62vh]">{visual}</div>
    </div>
  );
}

export function Deck() {
  const { theme } = useTheme();
  const { play } = useSound();
  const [i, setI] = useState(0);
  const n = SLIDES.length;
  const touch = useRef<{ x: number; y: number } | null>(null);
  const wheelLock = useRef(0);
  const iRef = useRef(0);
  useEffect(() => {
    iRef.current = i;
  }, [i]);

  // El updater de setState debe ser puro (StrictMode lo llama 2×): el sonido va
  // fuera, decidido contra el índice vigente (iRef).
  const go = useCallback(
    (to: number) => {
      const cur = iRef.current;
      const next = Math.min(n - 1, Math.max(0, to));
      if (next === cur) return;
      play(next > cur ? "tick" : "soft");
      setI(next);
    },
    [n, play],
  );

  // Solo flechas ←/→ (no PageUp/Down/Home/End) para no secuestrar el scroll de
  // teclado del slide de finanzas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(iRef.current + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(iRef.current - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const slide = SLIDES[i];
  const pct = ((i + 1) / n) * 100;

  return (
    <div
      className="relative flex h-[100dvh] flex-col overflow-hidden"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Pitch de FlowPub"
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? i + 1 : i - 1);
        touch.current = null;
      }}
      onWheel={(e) => {
        // Dentro de un panel con scroll propio (p. ej. finanzas), cede el paso al
        // scroll nativo mientras le quede recorrido en esa dirección.
        const scrollable = (e.target as HTMLElement).closest<HTMLElement>(
          "[data-deck-scroll]",
        );
        if (scrollable) {
          const goingDown = e.deltaY > 0;
          const atBottom =
            scrollable.scrollTop + scrollable.clientHeight >=
            scrollable.scrollHeight - 2;
          const atTop = scrollable.scrollTop <= 2;
          if ((goingDown && !atBottom) || (!goingDown && !atTop)) return;
        }
        const now = Date.now();
        if (now - wheelLock.current < 550) return;
        if (Math.abs(e.deltaY) < 12) return; // ruido de trackpad
        wheelLock.current = now;
        go(iRef.current + (e.deltaY > 0 ? 1 : -1));
      }}
    >
      {/* progreso */}
      <div className="absolute inset-x-0 top-0 z-30 h-[3px] bg-line-soft">
        <div className="h-full bg-grana transition-[width] duration-300 ease-flow" style={{ width: `${pct}%` }} />
      </div>

      {/* anuncio de cambio de slide para lectores de pantalla */}
      <p className="sr-only" aria-live="polite">
        {`Diapositiva ${i + 1} de ${n}: ${slide.kicker} — ${slide.title}`}
      </p>

      {/* glow tenue */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[50vmin] w-[60vmin] -translate-x-1/2 rounded-full opacity-60 blur-[100px]"
        style={{ background: "radial-gradient(circle, var(--grana-wash), transparent 70%)" }}
        aria-hidden
      />

      {/* header */}
      <header className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" aria-label="FlowPub" className="fp-logo inline-flex items-center gap-2 text-ink">
          <FlowMark size={24} />
          <Wordmark size={19} />
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[12px] text-text-3 sm:inline">Pitch · 2026</span>
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-pill border border-line-2 px-3.5 py-1.5 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-[var(--hover)]"
          >
            Abrir la app <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>

      {/* slide */}
      <main className="relative z-10 min-h-0 flex-1">
        <div key={i} className="h-full" style={{ animation: "fp-fade .5s var(--ease-flow)" }}>
          <SlideView slide={slide} theme={theme} active />
        </div>
      </main>

      {/* controles */}
      <footer className="relative z-20 flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <button
          type="button"
          onClick={() => go(i - 1)}
          disabled={i === 0}
          aria-label="Anterior"
          className="fp-hit grid h-11 w-11 place-items-center rounded-pill border border-line-2 text-ink transition-colors hover:bg-[var(--hover)] disabled:opacity-30"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-1.5 sm:flex">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Ir a ${s.kicker}`}
                aria-current={idx === i ? "true" : undefined}
                onClick={() => go(idx)}
                className={cn(
                  "fp-hit-y h-2 rounded-pill transition-all duration-200",
                  idx === i ? "w-6 bg-grana" : "w-2 bg-line-2 hover:bg-text-3",
                )}
              />
            ))}
          </div>
          <span className="font-mono text-[12px] text-text-3">
            {String(i + 1).padStart(2, "0")} / {n}
          </span>
        </div>

        <button
          type="button"
          onClick={() => go(i + 1)}
          disabled={i === n - 1}
          aria-label="Siguiente"
          className="fp-hit grid h-11 w-11 place-items-center rounded-pill bg-grana text-white shadow-[var(--shadow-grana)] transition-transform hover:bg-grana-700 active:scale-95 disabled:opacity-30"
        >
          <ArrowRight size={18} />
        </button>
      </footer>
    </div>
  );
}
