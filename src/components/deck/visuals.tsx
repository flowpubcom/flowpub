"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Mic, PenLine, Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { FlowMark, Wordmark } from "@/components/brand";
import { ASK } from "./data";

type V = { theme: "light" | "dark"; active: boolean };

// Motita a la deriva (partícula ambiente).
function Drift({ i }: { i: number }) {
  const pos = [
    { l: "12%", t: "22%", c: "bg-grana" },
    { l: "78%", t: "30%", c: "bg-ocre" },
    { l: "30%", t: "72%", c: "bg-ocre" },
    { l: "66%", t: "68%", c: "bg-grana" },
    { l: "48%", t: "16%", c: "bg-champagne" },
  ][i % 5];
  return (
    <span
      className={cn("absolute h-1.5 w-1.5 rounded-pill opacity-60", pos.c)}
      style={{ left: pos.l, top: pos.t, animation: `fp-drift ${9 + i * 1.7}s var(--ease-flow) ${i * 0.4}s infinite` }}
      aria-hidden
    />
  );
}

export function OpeningVisual({ active }: V) {
  return (
    <div className="relative grid h-full w-full place-items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Drift key={i} i={i} />
      ))}
      <FlowMark
        key={active ? "on" : "off"}
        size={200}
        intro={active}
        className="text-grana"
      />
    </div>
  );
}

export function ClosingVisual({ active }: V) {
  return (
    <div className="relative grid h-full w-full place-items-center gap-6">
      <div className="flex flex-col items-center gap-6">
        <FlowMark key={active ? "on" : "off"} size={150} intro={active} className="text-grana" />
        <Wordmark size={52} />
        <p className="font-mono text-[13px] text-text-3">flowpub.app</p>
      </div>
    </div>
  );
}

export function NoiseVisual() {
  const rows = [92, 74, 88, 60, 80, 70, 96, 54, 84, 66];
  return (
    <div className="flex h-full w-full flex-col justify-center gap-3 px-2">
      {rows.map((w, i) => (
        <div
          key={i}
          className={cn("h-3 rounded-pill", i === 2 ? "bg-grana/40" : "bg-text-3/25")}
          style={{ width: `${w}%`, opacity: 1 - i * 0.06 }}
        />
      ))}
      <p className="mt-2 font-mono text-[12px] text-text-3">scroll… scroll… scroll…</p>
    </div>
  );
}

const PHRASE = "Escuchar a alguien tiene una profundidad que leer no da".split(" ");
export function KaraokeVisual({ active }: V) {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setK((x) => (x + 1) % PHRASE.length), 420);
    return () => clearInterval(id);
  }, [active]);
  return (
    <div className="flex h-full w-full flex-col justify-center gap-6">
      <p className="font-serif text-[clamp(1.5rem,3vw,2.4rem)] leading-snug">
        {PHRASE.map((w, i) => (
          <span
            key={i}
            className={cn(
              "transition-colors duration-200",
              i === k ? "text-ink" : "text-text-2",
            )}
            style={i === k ? { textShadow: "0 0 18px var(--champagne)", color: "var(--ink)" } : undefined}
          >
            {w}{" "}
          </span>
        ))}
      </p>
      <svg viewBox="0 0 400 40" className="w-full max-w-[420px]" aria-hidden>
        <path
          d="M0 20 Q 25 4 50 20 T 100 20 T 150 20 T 200 20 T 250 20 T 300 20 T 350 20 T 400 20"
          fill="none"
          stroke="var(--grana)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
          style={{ animation: "fp-flow 3s linear infinite" }}
        />
      </svg>
    </div>
  );
}

export function RecordVisual() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-8">
      <div className="relative grid place-items-center">
        <span className="absolute h-28 w-28 rounded-pill bg-grana/20" style={{ animation: "fp-breathe 2.4s var(--ease-flow) infinite" }} />
        <span className="absolute h-20 w-20 rounded-pill bg-grana/30" style={{ animation: "fp-breathe 2.4s var(--ease-flow) .3s infinite" }} />
        <span className="relative grid h-16 w-16 place-items-center rounded-pill bg-grana text-white shadow-[var(--shadow-grana)]">
          <Mic size={26} />
        </span>
      </div>
      <span className="font-mono text-2xl text-text-3">→</span>
      <div className="w-[190px] overflow-hidden rounded-card border border-line bg-surface shadow-[var(--shadow-hover)]">
        <MiniCover />
        <div className="space-y-2 p-3">
          <div className="h-2.5 w-4/5 rounded-pill bg-ink/80" />
          <div className="h-2 w-full rounded-pill bg-text-3/30" />
          <div className="h-2 w-2/3 rounded-pill bg-text-3/30" />
        </div>
      </div>
    </div>
  );
}

// Mini portada abstracta (cubos isométricos, dirección Escher/LeWitt).
function MiniCover() {
  return (
    <svg viewBox="0 0 190 107" className="block w-full" aria-hidden>
      <rect width="190" height="107" fill="var(--cover-canvas)" />
      {[
        [55, 55, "var(--grana)"],
        [95, 40, "var(--ocre)"],
        [120, 66, "var(--champagne)"],
        [78, 74, "var(--grana-700)"],
      ].map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M0 -14 L14 -7 L14 7 L0 14 L-14 7 L-14 -7 Z" fill={c as string} opacity="0.9" />
          <path d="M0 -14 L14 -7 L0 0 L-14 -7 Z" fill="var(--amate)" opacity="0.25" />
          <path d="M0 0 L14 -7 L14 7 L0 14 Z" fill="var(--tinta)" opacity="0.18" />
        </g>
      ))}
    </svg>
  );
}

const STEPS = [
  { Icon: Mic, t: "Grabar" },
  { Icon: Volume2, t: "Transcribe" },
  { Icon: PenLine, t: "Pulir" },
  { Icon: ImagePlus, t: "Portada" },
];
export function PipelineVisual() {
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <div className="relative">
        <svg viewBox="0 0 400 8" className="absolute left-0 top-6 w-full" aria-hidden>
          <line x1="8" y1="4" x2="392" y2="4" stroke="var(--line-2)" strokeWidth="2" />
          <line x1="8" y1="4" x2="392" y2="4" stroke="var(--grana)" strokeWidth="2.5" strokeDasharray="10 12" strokeLinecap="round" style={{ animation: "fp-flow 2.4s linear infinite" }} />
        </svg>
        <div className="relative flex justify-between">
          {STEPS.map(({ Icon, t }, i) => (
            <div key={t} className="flex flex-col items-center gap-2">
              <span className="grid h-12 w-12 place-items-center rounded-tile border border-line bg-surface text-grana-text">
                <Icon size={20} />
              </span>
              <span className="font-mono text-[11px] text-text-2">0{i + 1}</span>
              <span className="font-sans text-[13px] font-semibold text-ink">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrowserFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-window)]">
      <div className="flex items-center gap-2 border-b border-line-soft bg-surface-2 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-pill bg-text-3/40" />
        <span className="h-2.5 w-2.5 rounded-pill bg-text-3/40" />
        <span className="h-2.5 w-2.5 rounded-pill bg-text-3/40" />
        <span className="ml-2 rounded-pill bg-surface-3 px-3 py-0.5 font-mono text-[11px] text-text-2">flowpub.app</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="block w-full" loading="lazy" />
    </div>
  );
}

function PhoneFrame({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[26px] border-[5px] border-ink/85 bg-surface shadow-[var(--shadow-window)]", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="block w-full" loading="lazy" />
    </div>
  );
}

export function FeaturesVisual({ theme }: V) {
  return (
    <div className="relative h-full w-full">
      <BrowserFrame src={`/shots/pub-desktop-${theme}.png`} alt="El Pub de FlowPub" />
      <PhoneFrame src={`/shots/flow-mobile-${theme}.png`} alt="Un Flow en móvil" className="absolute -bottom-6 -right-2 w-[26%]" />
    </div>
  );
}

export function StateVisual({ theme }: V) {
  return (
    <div className="grid h-full w-full place-items-center">
      <BrowserFrame src={`/shots/perfil-desktop-${theme}.png`} alt="Perfil en FlowPub" />
    </div>
  );
}

export function BrandVisual() {
  const chips = ["var(--grana)", "var(--grana-700)", "var(--ocre)", "var(--champagne)", "var(--ink)"];
  return (
    <div className="flex h-full w-full flex-col gap-5">
      <div className="grid grid-cols-2 overflow-hidden rounded-card border border-line">
        <div className="grid place-items-center bg-[#F2EFE8] py-10">
          <svg width="70" height="70" viewBox="0 0 200 200" fill="none"><path d="M 96 176 C 140 172 176 140 176 100 C 176 56 140 24 100 24 C 60 24 26 56 26 100 C 26 138 56 166 96 156 C 130 148 150 124 150 100 C 150 76 130 60 108 64 C 92 67 86 80 92 92" stroke="#1A1714" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="grid place-items-center bg-[#1E1A16] py-10">
          <svg width="70" height="70" viewBox="0 0 200 200" fill="none"><path d="M 96 176 C 140 172 176 140 176 100 C 176 56 140 24 100 24 C 60 24 26 56 26 100 C 26 138 56 166 96 156 C 130 148 150 124 150 100 C 150 76 130 60 108 64 C 92 67 86 80 92 92" stroke="#F2EFE8" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
      <div className="flex gap-3">
        {chips.map((c, i) => (
          <span key={i} className="h-12 flex-1 rounded-lg border border-line" style={{ background: c }} />
        ))}
      </div>
      <p className="text-center font-sans text-[13px] text-text-2">Fraunces · Hanken Grotesk · Space Mono</p>
    </div>
  );
}

export function GenerativeVisual() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-5">
      {[
        { s: "text-3xl", o: "opacity-100" },
        { s: "text-xl", o: "opacity-70" },
        { s: "text-base", o: "opacity-45" },
      ].map((r, i) => (
        <p key={i} className={cn("font-serif italic text-ink", r.s, r.o)} style={{ animation: `fp-rise .6s var(--ease-flow) ${i * 140}ms both` }}>
          La misma voz, otro ritmo.
        </p>
      ))}
      <p className="font-mono text-[12px] text-grana-text">un LLM orquesta la presentación · la marca no cambia</p>
    </div>
  );
}

export function FounderVisual() {
  return (
    <div className="grid h-full w-full place-items-center">
      <svg viewBox="0 0 240 200" className="w-[74%]" aria-hidden>
        <rect width="240" height="200" rx="16" fill="var(--cover-canvas)" />
        {[
          [90, 90, "var(--grana)"],
          [140, 70, "var(--ocre)"],
          [120, 120, "var(--grana-700)"],
          [165, 118, "var(--champagne)"],
        ].map(([x, y, c], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(1.5)`}>
            <path d="M0 -14 L14 -7 L14 7 L0 14 L-14 7 L-14 -7 Z" fill={c as string} opacity="0.92" />
            <path d="M0 -14 L14 -7 L0 0 L-14 -7 Z" fill="var(--amate)" opacity="0.25" />
            <path d="M0 0 L14 -7 L14 7 L0 14 Z" fill="var(--tinta)" opacity="0.18" />
          </g>
        ))}
        <text x="120" y="185" textAnchor="middle" className="font-mono" fontSize="11" fill="var(--text-2)" fontFamily="var(--font-mono)">barro → código</text>
      </svg>
    </div>
  );
}

export function BraidVisual() {
  return (
    <div className="grid h-full w-full place-items-center gap-6">
      <svg viewBox="0 0 260 120" className="w-[80%]" aria-hidden>
        <path d="M10 30 C 80 30 90 90 130 60" fill="none" stroke="var(--ocre)" strokeWidth="3" strokeLinecap="round" />
        <path d="M10 90 C 80 90 90 30 130 60" fill="none" stroke="var(--grana)" strokeWidth="3" strokeLinecap="round" />
        <g transform="translate(150 22) scale(0.38)">
          <path d="M 96 176 C 140 172 176 140 176 100 C 176 56 140 24 100 24 C 60 24 26 56 26 100 C 26 138 56 166 96 156 C 130 148 150 124 150 100 C 150 76 130 60 108 64 C 92 67 86 80 92 92" fill="none" stroke="var(--grana)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <p className="font-mono text-[12px] text-text-2">voz + IA → una sola vírgula</p>
    </div>
  );
}

export function AskVisual({ active }: V) {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <p className="font-serif text-[clamp(3rem,9vw,6rem)] font-medium leading-none text-ink">
          ${ASK.amountUsd.toLocaleString("en-US")}
        </p>
        <p className="mt-2 font-mono text-[14px] text-text-2">
          USD · ≈ ${ASK.mxn.toLocaleString("es-MX")} MXN · {ASK.months} meses de runway
        </p>
      </div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="grid h-9 w-9 place-items-center rounded-md border border-line bg-grana-wash font-mono text-[11px] text-grana-text"
            style={{ animation: active ? `fp-rise .4s var(--ease-flow) ${i * 80}ms both` : "none" }}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
