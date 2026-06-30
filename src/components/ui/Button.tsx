"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";
import type { BlipType } from "@/lib/sound";

// ── Button (componente exemplar) ─────────────────────────────────────────────
// Fija las convenciones de la librería: variantes por mapa, `cn` para clases,
// tokens (nada de hex), sonido por contexto, focus grana (global), press scale.

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-semibold rounded-pill " +
  "select-none whitespace-nowrap cursor-pointer " +
  "transition-[transform,background-color,color,box-shadow,border-color] duration-150 ease-flow " +
  "active:scale-[.97] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-grana text-white shadow-[var(--shadow-grana)] hover:bg-grana-700",
  secondary:
    "bg-transparent text-ink border border-line-2 hover:bg-[var(--hover)]",
  ghost: "bg-transparent text-text-2 hover:bg-[var(--hover)] hover:text-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-[15px]",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Blip al click. Default según variante; `null` lo desactiva. */
  sound?: BlipType | null;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth,
    sound,
    className,
    onClick,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const { play } = useSound();
  const blip: BlipType | null =
    sound === undefined ? (variant === "primary" ? "pop" : "click") : sound;

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      onClick={(e) => {
        if (blip) play(blip);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
});
