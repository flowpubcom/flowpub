"use client";

import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  /** Texto visible (también sirve de aria-label). */
  label?: string;
  id?: string;
  className?: string;
}

/** Toggle custom accesible (role=switch). Grana cuando está activo. */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  id,
  className,
}: SwitchProps) {
  const { play } = useSound();

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        play("tick");
        onCheckedChange(!checked);
      }}
      className={cn(
        "inline-flex min-h-[44px] select-none items-center gap-3",
        disabled && "pointer-events-none cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-[26px] w-[44px] flex-none items-center rounded-pill transition-colors duration-150 ease-flow",
          checked ? "bg-grana" : "bg-line-2",
        )}
      >
        <span
          className={cn(
            "ml-[3px] h-5 w-5 rounded-pill bg-papel shadow-[var(--shadow-thumb)] transition-transform duration-150 ease-flow",
            checked && "translate-x-[18px]",
          )}
        />
      </span>
      {label && <span className="font-sans text-[14px] text-ink">{label}</span>}
    </button>
  );
}
