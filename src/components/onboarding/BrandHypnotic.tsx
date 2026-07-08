import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const MARK_PATH =
  "M 96 176 C 140 172 176 140 176 100 C 176 56 140 24 100 24 C 60 24 26 56 26 100 C 26 138 56 166 96 156 C 130 148 150 124 150 100 C 150 76 130 60 108 64 C 92 67 86 80 92 92";

/**
 * Fondo hipnótico del onboarding: blobs grana/ocre a la deriva + anillos que
 * giran, sobre el «abismo de marca». Fijo en ambos temas (es marca). Todo el
 * movimiento se apaga con prefers-reduced-motion (capa global).
 */
function HypnoticBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="absolute rounded-pill blur-[38px]"
        style={{
          top: "8%",
          left: "-10%",
          width: 300,
          height: 300,
          opacity: 0.55,
          background: "radial-gradient(circle, var(--grana), transparent 68%)",
          animation: "fp-blob1 14s ease-in-out infinite",
        }}
      />
      <span
        className="absolute rounded-pill blur-[40px]"
        style={{
          bottom: "2%",
          right: "-12%",
          width: 280,
          height: 280,
          opacity: 0.5,
          background: "radial-gradient(circle, var(--ocre), transparent 66%)",
          animation: "fp-blob2 17s ease-in-out infinite",
        }}
      />
      <span
        className="absolute rounded-pill blur-[34px]"
        style={{
          top: "42%",
          left: "38%",
          width: 220,
          height: 220,
          opacity: 0.45,
          background: "radial-gradient(circle, var(--grana-700), transparent 70%)",
          animation: "fp-blob3 12s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/** Marca centrada: vírgula que respira + wordmark + tagline. */
export function BrandLockup({
  markSize = 74,
  tagline = true,
}: {
  markSize?: number;
  tagline?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center gap-[22px] text-center">
      <span className="fp-breathe inline-block leading-[0] [transform-origin:50%_50%]">
        <svg
          width={markSize}
          height={markSize}
          viewBox="0 0 200 200"
          aria-hidden
        >
          <path
            d={MARK_PATH}
            fill="none"
            stroke="var(--amate)"
            strokeWidth={11}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div
        className="font-serif text-[34px] font-medium tracking-[-.01em]"
        style={{ color: "var(--amate)" }}
      >
        <span className="italic">Flow</span>Pub
      </div>
      {tagline && (
        <p
          className="m-0 max-w-[24ch] font-serif text-[20px] italic leading-[1.4]"
          style={{ color: "color-mix(in srgb, var(--amate) 82%, transparent)" }}
        >
          La voz que se vuelve publicación.
        </p>
      )}
    </div>
  );
}

/** Contenedor del abismo hipnótico (bg + hijos). */
export function BrandHypnotic({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        className,
      )}
      style={{ background: "var(--brand-abyss)" }}
    >
      <HypnoticBg />
      {children}
    </div>
  );
}
