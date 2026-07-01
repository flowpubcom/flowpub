import { COVER_PALETTE as P, hashSeed, mulberry32 } from "@/lib/covers";

// Banner del perfil: collage nocturno de las 4 direcciones de arte (Turrell
// glow + barras Flavin + trazo geométrico), sembrado por username →
// determinista (SSR seguro) y distinto por persona. Fijo en ambos temas.

const W = 1180;
const H = 150;

export function ProfileBanner({ seed }: { seed: string }) {
  const r = mulberry32(hashSeed(`banner-${seed}`));
  const uid = seed.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20) || "p";
  const glowId = `pb-glow-${uid}`;
  const gradId = `pb-tur-${uid}`;

  const cx = 180 + r() * 320;
  const hue = [P.grana, P.ocre, P.champagne][Math.floor(r() * 3)];
  const barsX = 700 + r() * 220;
  const triX = 480 + r() * 260;

  return (
    <div
      className="relative h-[150px] overflow-hidden"
      style={{ background: "var(--brand-abyss)" }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="46%" r="60%">
            <stop offset="0%" stopColor={P.champagne} />
            <stop offset="45%" stopColor={hue} />
            <stop offset="100%" stopColor={P.tinta} stopOpacity="0" />
          </radialGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <ellipse
          cx={cx}
          cy={60 + r() * 40}
          rx={230 + r() * 60}
          ry={130}
          fill={`url(#${gradId})`}
          filter={`url(#${glowId})`}
          opacity={0.55}
        />
        <g filter={`url(#${glowId})`} opacity={0.6}>
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={barsX + i * (60 + r() * 30)}
              y={-20 + r() * 30}
              width={14}
              height={140 + r() * 30}
              rx={7}
              fill={i % 2 ? P.ocre : P.grana}
            />
          ))}
        </g>
        <polygon
          points={`${triX},20 ${triX + 40},120 ${triX - 40},120`}
          fill="none"
          stroke={P.amate}
          strokeWidth={2}
          opacity={0.4}
        />
      </svg>
    </div>
  );
}
