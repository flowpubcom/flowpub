"use client";

import { cn } from "@/lib/cn";

export interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  label?: string;
  /** Formatea el valor mostrado (p. ej. mm:ss). */
  format?: (v: number) => string;
  id?: string;
  className?: string;
}

/** Slider de rango con valor en vivo (límites del admin). */
export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  format,
  id,
  className,
}: SliderProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between gap-4">
        {label ? (
          <label
            htmlFor={id}
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3"
          >
            {label}
          </label>
        ) : (
          <span />
        )}
        <span className="font-mono text-[13px] tabular-nums text-ink">
          {format ? format(value) : String(value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-[var(--grana)]"
      />
    </div>
  );
}
