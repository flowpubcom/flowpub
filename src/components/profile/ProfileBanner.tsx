"use client";

import { useEffect, useRef, useState } from "react";
import { useSound } from "@/providers/SoundProvider";
import {
  COVER_PALETTE as P,
  geometricKindFromSeed,
  hashSeed,
  mulberry32,
  sanitizeId,
} from "@/lib/covers";

// Banner del perfil: una de las 4 direcciones de arte de la marca (el MISMO
// sistema que las portadas de Flow — Escher/Turrell/Flavin/collage), elegida
// por seed → determinista y distinta por persona. Nocturno y fijo en ambos
// temas (es un encabezado, no contenido de Flow).
//
// Al pasar el cursor o tocar, el encabezado SUENA: un pulso de sonar se abre
// desde donde está la mano y una línea-vírgula viaja de lado a lado — el mismo
// idioma del reproductor (la línea que ondula, nunca barritas de waveform).
// Antes era un barrido de luz genérico, que no decía nada del producto.
// La capa entera solo existe mientras hay contacto: al soltar se DESMONTA y no
// queda rastro. En táctil se auto-apaga sola porque no hay «salir».

const W = 1180;
const H = 150;

/** Cuánto dura el saludo en táctil (no hay pointerleave que lo apague). */
const TOUCH_MS = 1800;

export function ProfileBanner({
  seed,
  imageUrl,
}: {
  seed: string;
  /** Banner subido por el usuario; si falta, el generativo por seed. */
  imageUrl?: string | null;
}) {
  const { play } = useSound();
  const [live, setLive] = useState(false);
  // Origen del sonar, en % del contenedor. Default al centro por si el saludo
  // entra por teclado/táctil sin coordenadas útiles.
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const lastFire = useRef(0);
  const touchTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (touchTimer.current) window.clearTimeout(touchTimer.current);
    },
    [],
  );

  const wake = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - box.left) / box.width) * 100,
      y: ((e.clientY - box.top) / box.height) * 100,
    });
    setLive(true);
    // Un blip por saludo: sin el freno, mover el cursor sobre el borde
    // dispararía el sonido en ráfaga.
    const now = Date.now();
    if (now - lastFire.current > 900) {
      lastFire.current = now;
      play("soft");
    }
    if (e.pointerType === "touch") {
      if (touchTimer.current) window.clearTimeout(touchTimer.current);
      touchTimer.current = window.setTimeout(() => setLive(false), TOUCH_MS);
    }
  };

  return (
    <div
      className="relative h-[150px] overflow-hidden bg-[var(--brand-abyss)]"
      onPointerEnter={wake}
      onPointerDown={wake}
      onPointerMove={(e) => {
        if (!live || e.pointerType === "touch") return;
        const box = e.currentTarget.getBoundingClientRect();
        setOrigin({
          x: ((e.clientX - box.left) / box.width) * 100,
          y: ((e.clientY - box.top) / box.height) * 100,
        });
      }}
      onPointerLeave={() => setLive(false)}
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
          className="absolute inset-0 bg-[linear-gradient(to_top,var(--scrim-soft),transparent_45%)]"
        />
      )}
      {live && <SoundGreeting x={origin.x} y={origin.y} />}
    </div>
  );
}

/** La capa que «suena»: sonar desde la mano + la línea-vírgula viajando.
 *  Se monta solo mientras hay contacto, así que en reposo no cuesta nada. */
function SoundGreeting({ x, y }: { x: number; y: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 [animation:fp-wave-in_.24s_var(--ease-flow)]"
    >
      {/* tres anillos escalonados: se abren desde donde está la mano */}
      {[0, 0.45, 0.9].map((delay) => (
        <span
          key={delay}
          className="absolute h-[220px] w-[220px] rounded-pill border-2 border-[var(--cover-champagne,#F6D49A)] [animation:fp-sonar_1.35s_var(--ease-flow)_infinite]"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }}
        />
      ))}
      {/* la línea que ondula: el path se repite, así el viaje no tiene costura */}
      <svg
        viewBox={`0 0 ${W * 2} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-70"
      >
        <path
          d={travelingWave()}
          fill="none"
          stroke="#F6D49A"
          strokeWidth={2.5}
          strokeLinecap="round"
          className="[animation:fp-wave-travel_3.2s_linear_infinite]"
        />
      </svg>
    </span>
  );
}

/** Sinusoide de dos ciclos idénticos: al recorrer la mitad del ancho, el dibujo
 *  vuelve a coincidir consigo mismo y el bucle empalma sin salto. */
function travelingWave(): string {
  const mid = H / 2;
  const amp = 26;
  const step = W / 4; // 4 medias ondas por ancho → 8 en el doble
  let d = `M 0 ${mid}`;
  for (let i = 0; i < 8; i++) {
    const dir = i % 2 === 0 ? -1 : 1;
    d += ` q ${step / 2} ${amp * dir} ${step} 0`;
  }
  return d;
}

function GenerativeBanner({ seed }: { seed: string }) {
  const seedInt = hashSeed(`banner-${seed}`);
  // Solo las cuatro geométricas: en una franja de 150px las atmosféricas
  // (riley/eliasson/saraceno) se leen como una mancha, y además aquí no hay
  // componentes para ellas.
  const kind = geometricKindFromSeed(`banner-${seed}`);
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
