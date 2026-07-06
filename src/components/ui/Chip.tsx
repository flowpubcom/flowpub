"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";
import type { BlipType } from "@/lib/sound";

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** Contador opcional (en Space Mono tras el label). */
  count?: number;
  /** Blip al click; `null` lo desactiva. */
  sound?: BlipType | null;
}

/** Chip de filtro de tags. Activo = pastilla tinta; inactivo = contorno. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  {
    active = false,
    count,
    sound = "tick",
    className,
    onClick,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const { play } = useSound();

  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(
        "inline-flex h-[34px] items-center gap-2 whitespace-nowrap rounded-pill border px-[15px] font-sans text-[13px] transition-colors duration-150 ease-flow active:scale-[.97]",
        active
          ? "border-ink bg-ink font-semibold text-ink-on"
          : // Fondo sólido (papel): sobre la barra glass del Pub, los chips
            // transparentes se perdían con los Flows pasando por atrás.
            "border-line-2 bg-surface font-medium text-text-2 hover:border-ink hover:text-ink",
        className,
      )}
      onClick={(e) => {
        if (sound) play(sound);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
      {typeof count === "number" && (
        <span className="font-mono text-[11px] opacity-70">{count}</span>
      )}
    </button>
  );
});
