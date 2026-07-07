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

// Roles del lienzo que voltean con el tema (tokens --cover-* en globals.css);
// los ACENTOS (grana/ocre/champagne) quedan fijos: son la marca.
const CANVAS = "var(--cover-canvas)";
const SHADOW = "var(--cover-shadow)";
const LINE = "var(--cover-line)";
const NIGHT = "var(--cover-night)";

// ── escher / leWitt — cubos isométricos con hatch ──────────────────────────
const TRIOS: [string, string, string][] = [
  [P.champagne, P.ocre, P.grana700],
  [P.amate, P.grana, SHADOW],
  [P.papel, P.ocre, SHADOW],
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

// Tres composiciones (el seed elige): retícula suelta, monolito con sombra
// larga, y escalera isométrica. Todas comparten el hatch de tinta.
function Escher({ seed, uid }: { seed: number; uid: string }) {
  const r = mulberry32(seed);
  const hatchId = `hatch-${uid}`;
  const variant = pick(r, ["grid", "monolith", "steps"] as const);
  const nodes: React.ReactNode[] = [];

  if (variant === "grid") {
    const dense = r() < 0.5;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        if (r() < (dense ? 0.12 : 0.34)) continue;
        const cx = 52 + i * 76 + range(r, -10, 10);
        const cy = 52 + j * 70 + range(r, -8, 8);
        const s = range(r, 20, 34);
        nodes.push(
          <g key={`${i}-${j}`} opacity={range(r, 0.85, 1)}>
            {cube(cx, cy, s, pick(r, TRIOS), r() < 0.5 ? hatchId : undefined)}
          </g>,
        );
      }
    }
  } else if (variant === "monolith") {
    // 2-3 cubos GRANDES apilados + sombra larga diagonal (LeWitt sólido).
    const baseX = range(r, 150, 260);
    const baseY = range(r, 130, 160);
    const n = 2 + Math.floor(r() * 2);
    const s0 = range(r, 46, 60);
    nodes.push(
      <polygon
        key="shadow"
        points={`${baseX},${baseY + s0} ${baseX + 190},${H + 10} ${baseX - 240},${H + 10}`}
        fill={SHADOW}
        opacity={0.14}
      />,
    );
    for (let i = 0; i < n; i++) {
      const s = s0 - i * range(r, 8, 14);
      nodes.push(
        <g key={i}>
          {cube(
            baseX + range(r, -6, 6),
            baseY - i * (s0 * 1.35),
            s,
            pick(r, TRIOS),
            r() < 0.6 ? hatchId : undefined,
          )}
        </g>,
      );
    }
    // satélite chico al costado
    if (r() < 0.7) {
      nodes.push(
        <g key="sat" opacity={0.92}>
          {cube(range(r, 50, 90), range(r, 150, 180), range(r, 14, 20), pick(r, TRIOS), hatchId)}
        </g>,
      );
    }
  } else {
    // steps: escalera isométrica que baja de izquierda a derecha.
    const n = 4 + Math.floor(r() * 2);
    const s = range(r, 26, 34);
    let cx = range(r, 60, 90);
    let cy = range(r, 60, 80);
    for (let i = 0; i < n; i++) {
      nodes.push(
        <g key={i} opacity={range(r, 0.9, 1)}>
          {cube(cx, cy, s, pick(r, TRIOS), i % 2 === 0 ? hatchId : undefined)}
        </g>,
      );
      cx += s * 1.72;
      cy += s * 0.86;
    }
    // línea de horizonte al fondo
    nodes.unshift(
      <line
        key="hz"
        x1={0}
        y1={range(r, 40, 70)}
        x2={W}
        y2={range(r, 90, 130)}
        stroke={LINE}
        strokeWidth={1.4}
        opacity={0.25}
      />,
    );
  }

  // Banda diagonal de hatch de fondo (textura extra, a veces).
  const band = r() < 0.5 && (
    <rect
      x={-60}
      y={range(r, 30, 140)}
      width={W + 120}
      height={range(r, 34, 70)}
      fill={`url(#${hatchId})`}
      opacity={0.5}
      transform={`rotate(${range(r, -14, 14)} ${W / 2} ${H / 2})`}
    />
  );

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
          <line x1="0" y1="0" x2="0" y2="6" stroke={LINE} strokeWidth="1.2" opacity="0.45" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={CANVAS} />
      {band}
      {nodes}
    </>
  );
}

// ── turrell — apertura con resplandor (4 formas: sala, óvalo, arco, ranura) ─
function Turrell({ seed, uid }: { seed: number; uid: string }) {
  const r = mulberry32(seed);
  const gid = `tur-${uid}`;
  const blur = `tb-${uid}`;
  const hue = pick(r, [P.grana, P.ocre, P.champagne]);
  const shape = pick(r, ["room", "oval", "arch", "slit"] as const);
  const cx = 200 + range(r, -36, 36);
  const cy = 112 + range(r, -22, 22);

  // Halos concéntricos + núcleo, con la forma elegida.
  const halo = (k: number, opacity: number, core = false) => {
    const w = (core ? 76 : 240 * k) / 2;
    const h = (core ? 48 : 140 * k) / 2;
    const fill = core ? P.champagne : hue;
    const common = { fill, opacity, filter: `url(#${blur})` } as const;
    if (shape === "oval") {
      return <ellipse key={`${k}-${core}`} cx={cx} cy={cy} rx={w} ry={h} {...common} />;
    }
    if (shape === "arch") {
      return (
        <path
          key={`${k}-${core}`}
          d={`M ${cx - w} ${cy + h} L ${cx - w} ${cy} A ${w} ${h * 1.4} 0 0 1 ${cx + w} ${cy} L ${cx + w} ${cy + h} Z`}
          {...common}
        />
      );
    }
    if (shape === "slit") {
      return (
        <rect
          key={`${k}-${core}`}
          x={cx - w * 0.28}
          y={cy - h * 1.7}
          width={w * 0.56}
          height={h * 3.4}
          rx={w * 0.22}
          {...common}
        />
      );
    }
    return (
      <rect
        key={`${k}-${core}`}
        x={cx - w}
        y={cy - h}
        width={w * 2}
        height={h * 2}
        rx={core ? 16 : 40 * k}
        {...common}
      />
    );
  };

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
      <rect width={W} height={H} fill={NIGHT} />
      <rect width={W} height={H} fill={`url(#${gid})`} opacity="0.55" />
      {[0, 1, 2, 3].map((i) => halo(1 - i * 0.22, 0.1 + i * 0.12))}
      {halo(1, 0.92, true)}
      {/* línea de horizonte tenue (piso de la sala), a veces */}
      {r() < 0.55 && (
        <line
          x1={0}
          y1={cy + range(r, 58, 76)}
          x2={W}
          y2={cy + range(r, 58, 76)}
          stroke={P.champagne}
          strokeWidth={1}
          opacity={0.18}
        />
      )}
    </>
  );
}

// ── flavin — neón con glow (vertical, horizontal o recargado en diagonal) ──
function Flavin({ seed, uid }: { seed: number; uid: string }) {
  const r = mulberry32(seed);
  const glow = `fg-${uid}`;
  const cols = [P.grana, P.ocre, P.champagne, P.grana700];
  const variant = pick(r, ["vertical", "horizontal", "leaning"] as const);
  const bars: React.ReactNode[] = [];

  if (variant === "horizontal") {
    let y = range(r, 14, 40);
    for (let i = 0; i < 6 && y < H - 14; i++) {
      const h = range(r, 8, 20);
      const w = range(r, 120, 320);
      const x = range(r, 8, Math.max(10, W - w - 8));
      bars.push(
        <rect
          key={i}
          x={x}
          y={y}
          width={w}
          height={h}
          rx={h / 2}
          fill={pick(r, cols)}
          opacity={range(r, 0.82, 1)}
          filter={`url(#${glow})`}
        />,
      );
      y += h + range(r, 18, 40);
    }
  } else {
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
  }

  // Barra cruzada de contraste (el «leaning» clásico de Flavin), casi siempre
  // en la variante diagonal y a veces en las demás.
  const crossed = (variant === "leaning" || r() < 0.3) && (
    <rect
      x={range(r, 60, 240)}
      y={-30}
      width={range(r, 12, 20)}
      height={H + 60}
      rx={8}
      fill={pick(r, cols)}
      opacity={0.9}
      filter={`url(#${glow})`}
      transform={`rotate(${range(r, 16, 34)} ${W / 2} ${H / 2})`}
    />
  );

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
      <rect width={W} height={H} fill={NIGHT} />
      <g transform={variant === "leaning" ? `rotate(${range(r, -16, -8)} ${W / 2} ${H / 2})` : undefined}>
        {bars}
      </g>
      {crossed}
    </>
  );
}

// ── collage 90s — Lichtenstein + Ben-Day ───────────────────────────────────
function Collage({ seed, uid }: { seed: number; uid: string }) {
  const r = mulberry32(seed);
  const dots = `dot-${uid}`;
  const cols = [P.grana, P.ocre, P.champagne, P.amate2, SHADOW];
  const shapes: React.ReactNode[] = [];

  // Ancla ocasional: media luna GRANDE que organiza la composición.
  if (r() < 0.45) {
    const ax = range(r, 60, 340);
    const flip = r() < 0.5 ? 1 : 0;
    shapes.push(
      <path
        key="anchor"
        d={`M ${ax - 110} ${H} A 110 110 0 0 ${flip} ${ax + 110} ${H} Z`}
        fill={pick(r, cols)}
        opacity={0.9}
      />,
    );
  }
  // Tira de papel rasgado (banda irregular), a veces.
  if (r() < 0.4) {
    const ty = range(r, 30, 170);
    const pts = [];
    for (let px = -10; px <= W + 10; px += 40) {
      pts.push(`${px},${ty + range(r, -6, 6)}`);
    }
    for (let px = W + 10; px >= -10; px -= 40) {
      pts.push(`${px},${ty + range(r, 22, 38)}`);
    }
    shapes.push(
      <polygon
        key="strip"
        points={pts.join(" ")}
        fill={pick(r, [P.papel, P.amate2, P.champagne])}
        opacity={0.85}
        transform={`rotate(${range(r, -6, 6)} ${W / 2} ${ty})`}
      />,
    );
  }

  const n = 6 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const type = pick(r, ["circle", "tri", "quarter", "rect", "ring", "benday"] as const);
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
    } else if (type === "ring") {
      shapes.push(
        <circle
          key={i}
          cx={x}
          cy={y}
          r={s / 2}
          fill="none"
          stroke={c}
          strokeWidth={range(r, 6, 12)}
          opacity={op}
        />,
      );
    } else if (type === "benday") {
      // Parche Ben-Day: rect relleno SOLO de puntos, girado — muy Lichtenstein.
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
          <circle cx="2" cy="2" r="1.6" fill={LINE} opacity="0.3" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={CANVAS} />
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
            style={{
              mixBlendMode:
                "var(--cover-grain)" as React.CSSProperties["mixBlendMode"],
            }}
          />
        </>
      )}
    </svg>
  );
}
