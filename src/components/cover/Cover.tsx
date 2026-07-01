import { cn } from "@/lib/cn";
import {
  COVER_PALETTE as P,
  hashSeed,
  kindFromSeed,
  mulberry32,
  sanitizeId,
  type CoverKind,
} from "@/lib/covers";

export type { CoverKind };

export interface CoverProps {
  kind?: CoverKind | "auto";
  seed?: string | number;
  title?: string;
  grain?: boolean;
  className?: string;
}

const W = 400;
const H = 225;

type Rng = () => number;
const pick = <T,>(r: Rng, arr: readonly T[]): T =>
  arr[Math.floor(r() * arr.length)];
const range = (r: Rng, a: number, b: number) => a + r() * (b - a);

// ── escher / leWitt — cubos isométricos con hatch ──────────────────────────
const TRIOS: [string, string, string][] = [
  [P.champagne, P.ocre, P.grana700],
  [P.amate, P.grana, P.tinta],
  [P.papel, P.ocre, P.tinta],
  [P.champagne, P.grana, P.grana700],
];

function cube(
  cx: number,
  cy: number,
  s: number,
  cols: [string, string, string],
  hatchId?: string,
) {
  const k = s * 0.86;
  const top = `${cx},${cy - s} ${cx + k},${cy - s * 0.5} ${cx},${cy} ${cx - k},${cy - s * 0.5}`;
  const left = `${cx - k},${cy - s * 0.5} ${cx},${cy} ${cx},${cy + s} ${cx - k},${cy + s * 0.5}`;
  const right = `${cx + k},${cy - s * 0.5} ${cx},${cy} ${cx},${cy + s} ${cx + k},${cy + s * 0.5}`;
  return (
    <g>
      <polygon points={top} fill={cols[0]} />
      <polygon points={left} fill={cols[1]} />
      <polygon points={right} fill={cols[2]} />
      {hatchId && <polygon points={left} fill={`url(#${hatchId})`} />}
    </g>
  );
}

function Escher({ seed, uid }: { seed: number; uid: string }) {
  const r = mulberry32(seed);
  const hatchId = `hatch-${uid}`;
  const cubes: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 3; j++) {
      if (r() < 0.22) continue;
      const cx = 52 + i * 76 + range(r, -10, 10);
      const cy = 52 + j * 70 + range(r, -8, 8);
      const s = range(r, 20, 34);
      cubes.push(
        <g key={`${i}-${j}`} opacity={range(r, 0.85, 1)}>
          {cube(cx, cy, s, pick(r, TRIOS), r() < 0.5 ? hatchId : undefined)}
        </g>,
      );
    }
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
          <line x1="0" y1="0" x2="0" y2="6" stroke={P.tinta} strokeWidth="1.2" opacity="0.45" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={P.amate} />
      {cubes}
    </>
  );
}

// ── turrell — apertura con resplandor ──────────────────────────────────────
function Turrell({ seed, uid }: { seed: number; uid: string }) {
  const r = mulberry32(seed);
  const gid = `tur-${uid}`;
  const blur = `tb-${uid}`;
  const hue = pick(r, [P.grana, P.ocre, P.champagne]);
  const cx = 200 + range(r, -36, 36);
  const cy = 112 + range(r, -22, 22);
  return (
    <>
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={P.champagne} stopOpacity="1" />
          <stop offset="38%" stopColor={hue} stopOpacity="0.85" />
          <stop offset="100%" stopColor={P.tinta} stopOpacity="0" />
        </radialGradient>
        <filter id={blur} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect width={W} height={H} fill={P.tinta} />
      <rect width={W} height={H} fill={`url(#${gid})`} opacity="0.55" />
      {[0, 1, 2, 3].map((i) => {
        const k = 1 - i * 0.22;
        return (
          <rect
            key={i}
            x={cx - 120 * k}
            y={cy - 70 * k}
            width={240 * k}
            height={140 * k}
            rx={40 * k}
            fill={hue}
            opacity={0.1 + i * 0.12}
            filter={`url(#${blur})`}
          />
        );
      })}
      <rect
        x={cx - 38}
        y={cy - 24}
        width={76}
        height={48}
        rx={16}
        fill={P.champagne}
        opacity="0.92"
        filter={`url(#${blur})`}
      />
    </>
  );
}

// ── flavin — barras de neón con glow ───────────────────────────────────────
function Flavin({ seed, uid }: { seed: number; uid: string }) {
  const r = mulberry32(seed);
  const glow = `fg-${uid}`;
  const cols = [P.grana, P.ocre, P.champagne, P.grana700];
  const bars: React.ReactNode[] = [];
  let x = range(r, 18, 46);
  for (let i = 0; i < 8 && x < W - 18; i++) {
    const w = range(r, 10, 26);
    const h = range(r, 90, 200);
    const y = range(r, 8, Math.max(10, H - h - 8));
    bars.push(
      <rect
        key={i}
        x={x}
        y={y}
        width={w}
        height={h}
        rx={w / 2}
        fill={pick(r, cols)}
        opacity={range(r, 0.82, 1)}
        filter={`url(#${glow})`}
      />,
    );
    x += w + range(r, 24, 52);
  }
  return (
    <>
      <defs>
        <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.4" result="b" />
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

// ── collage 90s — Lichtenstein + Ben-Day ───────────────────────────────────
function Collage({ seed, uid }: { seed: number; uid: string }) {
  const r = mulberry32(seed);
  const dots = `dot-${uid}`;
  const cols = [P.grana, P.ocre, P.champagne, P.amate2, P.tinta];
  const shapes: React.ReactNode[] = [];
  const n = 6 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const type = pick(r, ["circle", "tri", "quarter", "rect"] as const);
    const c = pick(r, cols);
    const x = range(r, 36, 364);
    const y = range(r, 22, 204);
    const s = range(r, 34, 84);
    const op = range(r, 0.78, 1);
    if (type === "circle") {
      shapes.push(<circle key={i} cx={x} cy={y} r={s / 2} fill={c} opacity={op} />);
    } else if (type === "rect") {
      shapes.push(
        <rect
          key={i}
          x={x - s / 2}
          y={y - s / 2}
          width={s}
          height={s}
          fill={c}
          opacity={op}
          transform={`rotate(${range(r, -20, 20)} ${x} ${y})`}
        />,
      );
    } else if (type === "tri") {
      shapes.push(
        <polygon
          key={i}
          points={`${x},${y - s / 2} ${x + s / 2},${y + s / 2} ${x - s / 2},${y + s / 2}`}
          fill={c}
          opacity={op}
        />,
      );
    } else {
      shapes.push(
        <path
          key={i}
          d={`M ${x} ${y} L ${x + s} ${y} A ${s} ${s} 0 0 1 ${x} ${y + s} Z`}
          fill={c}
          opacity={op}
        />,
      );
    }
  }
  return (
    <>
      <defs>
        <pattern id={dots} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" fill={P.tinta} opacity="0.3" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={P.amate} />
      {shapes}
      <rect width={W} height={H} fill={`url(#${dots})`} opacity="0.4" />
    </>
  );
}

/** Portada generativa 16:9 — paleta bloqueada, determinista por seed. */
export function Cover({
  kind = "auto",
  seed = 0,
  title,
  grain = true,
  className,
}: CoverProps) {
  const seedInt = hashSeed(seed);
  const k: CoverKind = kind === "auto" ? kindFromSeed(seed) : kind;
  const uid = `${sanitizeId(seed)}-${k}`;
  const grainId = `grain-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={title ?? `Portada ${k}`}
      className={cn("block aspect-[16/9] w-full", className)}
    >
      {k === "escher" && <Escher seed={seedInt} uid={uid} />}
      {k === "turrell" && <Turrell seed={seedInt} uid={uid} />}
      {k === "flavin" && <Flavin seed={seedInt} uid={uid} />}
      {k === "collage" && <Collage seed={seedInt} uid={uid} />}
      {grain && (
        <>
          <defs>
            <filter id={grainId}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves={2}
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          <rect
            width={W}
            height={H}
            filter={`url(#${grainId})`}
            opacity={0.5}
            style={{ mixBlendMode: "multiply" }}
          />
        </>
      )}
    </svg>
  );
}
