"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";
import {
  COVER_PALETTE as P,
  hashSeed,
  kindFromSeed,
  mulberry32,
  sanitizeId,
} from "@/lib/covers";

// Banner del perfil: una de las 4 direcciones de arte de la marca (el MISMO
// sistema que las portadas de Flow — Escher/Turrell/Flavin/collage), elegida
// por seed → determinista y distinta por persona. Nocturno y fijo en ambos
// temas (es un encabezado, no contenido de Flow). Al pasar el cursor o el
// dedo, un barrido de luz + un blip celebran el encabezado — reusa fp-shine
// (ya definido para el shimmer de carga) en un contexto nuevo.

const W = 1180;
const H = 150;

export function ProfileBanner({
  seed,
  imageUrl,
}: {
  seed: string;
  /** Banner subido por el usuario; si falta, el generativo por seed. */
  imageUrl?: string | null;
}) {
  const { play } = useSound();
  const [sweep, setSweep] = useState(false);
  const lastFire = useRef(0);

  const trigger = () => {
    const now = Date.now();
    // Evita doble disparo (hover + click) en pantallas táctiles/híbridas.
    if (now - lastFire.current < 500) return;
    lastFire.current = now;
    play("pop");
    setSweep(true);
  };

  return (
    <div
      className="relative h-[150px] overflow-hidden bg-[var(--brand-abyss)]"
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") trigger();
      }}
      onClick={trigger}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <GenerativeBanner seed={seed} />
      )}
      {/* velo inferior sutil: el avatar traslapado sigue legible sobre foto */}
      {imageUrl && (
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(14,11,9,.28),transparent_45%)]"
        />
      )}
      {/* barrido de luz al pasar cursor/dedo — pequeño saludo de la marca */}
      <span
        aria-hidden
        onAnimationEnd={() => setSweep(false)}
        className={cn(
          "pointer-events-none absolute inset-0 [background-image:linear-gradient(115deg,transparent_35%,rgba(255,255,255,.4)_50%,transparent_65%)] [background-position:-120%_0] [background-size:250%_100%]",
          sweep && "[animation:fp-shine_.9s_ease]",
        )}
      />
    </div>
  );
}

function GenerativeBanner({ seed }: { seed: string }) {
  const seedInt = hashSeed(`banner-${seed}`);
  const kind = kindFromSeed(`banner-${seed}`);
  const uid = `pb-${sanitizeId(seed)}`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {kind === "turrell" && <BannerTurrell seed={seedInt} uid={uid} />}
      {kind === "flavin" && <BannerFlavin seed={seedInt} uid={uid} />}
      {kind === "escher" && <BannerEscher seed={seedInt} uid={uid} />}
      {kind === "collage" && <BannerCollage seed={seedInt} uid={uid} />}
    </svg>
  );
}

type Rng = () => number;
const pick = <T,>(r: Rng, arr: readonly T[]): T =>
  arr[Math.floor(r() * arr.length)];
const range = (r: Rng, a: number, b: number) => a + r() * (b - a);

// ── turrell — un solo resplandor amplio, cálido, casi meditativo ───────────
function BannerTurrell({ seed, uid }: { seed: number; uid: string }) {
  const r = mulberry32(seed);
  const gid = `pbt-${uid}`;
  const blur = `pbtb-${uid}`;
  const hue = pick(r, [P.grana, P.ocre, P.champagne] as const);
  const cx = W * range(r, 0.28, 0.72);
  const cy = H * range(r, 0.3, 0.7);
  return (
    <>
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor={P.champagne} stopOpacity="1" />
          <stop offset="42%" stopColor={hue} stopOpacity="0.85" />
          <stop offset="100%" stopColor={P.tinta} stopOpacity="0" />
        </radialGradient>
        <filter id={blur} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <rect width={W} height={H} fill={P.tinta} />
      <ellipse
        cx={cx}
        cy={cy}
        rx={range(r, 260, 380)}
        ry={range(r, 90, 130)}
        fill={`url(#${gid})`}
        filter={`url(#${blur})`}
        opacity={0.75}
      />
    </>
  );
}

// ── flavin — barras de neón con glow, ritmo horizontal ─────────────────────
function BannerFlavin({ seed, uid }: { seed: number; uid: string }) {
  const r = mulberry32(seed);
  const glow = `pbf-${uid}`;
  const cols = [P.grana, P.ocre, P.champagne, P.grana700] as const;
  const bars: React.ReactNode[] = [];
  let x = range(r, 20, 80);
  const n = 5 + Math.floor(r() * 3);
  for (let i = 0; i < n && x < W - 20; i++) {
    const w = range(r, 10, 22);
    const h = range(r, 70, H - 20);
    const y = (H - h) / 2 + range(r, -10, 10);
    bars.push(
      <rect
        key={i}
        x={x}
        y={y}
        width={w}
        height={h}
        rx={w / 2}
        fill={pick(r, cols)}
        opacity={range(r, 0.85, 1)}
        filter={`url(#${glow})`}
      />,
    );
    x += w + range(r, 30, 70);
  }
  return (
    <>
      <defs>
        <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width={W} height={H} fill={P.tinta} />
      {bars}
    </>
  );
}

// ── escher — horizonte quebrado de cubos isométricos ────────────────────────
function BannerEscher({ seed, uid }: { seed: number; uid: string }) {
  const r = mulberry32(seed);
  const hatchId = `pbe-${uid}`;
  const trios = [
    [P.champagne, P.ocre, P.grana700],
    [P.amate, P.grana, P.tinta],
    [P.papel, P.ocre, P.tinta],
  ] as const;
  const cubes: React.ReactNode[] = [];
  let cx = range(r, 40, 90);
  const baseY = H * range(r, 0.55, 0.7);
  while (cx < W + 60) {
    const s = range(r, 24, 42);
    const cy = baseY + range(r, -18, 18);
    const k = s * 0.86;
    const top = `${cx},${cy - s} ${cx + k},${cy - s * 0.5} ${cx},${cy} ${cx - k},${cy - s * 0.5}`;
    const left = `${cx - k},${cy - s * 0.5} ${cx},${cy} ${cx},${cy + s} ${cx - k},${cy + s * 0.5}`;
    const right = `${cx + k},${cy - s * 0.5} ${cx},${cy} ${cx},${cy + s} ${cx + k},${cy + s * 0.5}`;
    const cols = pick(r, trios);
    cubes.push(
      <g key={cx} opacity={range(r, 0.85, 1)}>
        <polygon points={top} fill={cols[0]} />
        <polygon points={left} fill={cols[1]} />
        <polygon points={right} fill={cols[2]} />
        {r() < 0.5 && <polygon points={left} fill={`url(#${hatchId})`} />}
      </g>,
    );
    cx += s * range(r, 1.7, 2.4);
  }
  return (
    <>
      <defs>
        <pattern
          id={hatchId}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke={P.amate} strokeWidth="1.2" opacity="0.4" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={P.tinta} />
      {cubes}
    </>
  );
}

// ── collage 90s — parches Ben-Day dispersos, textura despreocupada ─────────
function BannerCollage({ seed, uid }: { seed: number; uid: string }) {
  const r = mulberry32(seed);
  const dots = `pbc-${uid}`;
  const cols = [P.grana, P.ocre, P.champagne, P.amate2] as const;
  const shapes: React.ReactNode[] = [];
  const n = 9 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) {
    const x = range(r, 0, W);
    const y = range(r, 0, H);
    const s = range(r, 30, 70);
    const c = pick(r, cols);
    const type = pick(r, ["circle", "ring", "benday"] as const);
    if (type === "circle") {
      shapes.push(
        <circle key={i} cx={x} cy={y} r={s / 2} fill={c} opacity={range(r, 0.75, 1)} />,
      );
    } else if (type === "ring") {
      shapes.push(
        <circle
          key={i}
          cx={x}
          cy={y}
          r={s / 2}
          fill="none"
          stroke={c}
          strokeWidth={range(r, 5, 10)}
          opacity={range(r, 0.75, 1)}
        />,
      );
    } else {
      shapes.push(
        <rect
          key={i}
          x={x - s * 0.7}
          y={y - s / 2}
          width={s * 1.4}
          height={s}
          fill={`url(#${dots})`}
          opacity={0.9}
          transform={`rotate(${range(r, -18, 18)} ${x} ${y})`}
        />,
      );
    }
  }
  return (
    <>
      <defs>
        <pattern id={dots} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" fill={P.amate} opacity="0.35" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={P.tinta} />
      {shapes}
    </>
  );
}
