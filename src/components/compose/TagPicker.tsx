"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";
import { CATEGORIES } from "@/data/mock";

export function TagPicker({
  selected,
  onChange,
  max = 3,
  options = CATEGORIES,
  className,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  options?: string[];
  className?: string;
}) {
  const { play } = useSound();
  const [shake, setShake] = useState<string | null>(null);

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
      play("soft");
      return;
    }
    if (selected.length >= max) {
      // tope duro: sacudida + sonido suave, sin agregar
      play("soft");
      setShake(tag);
      window.setTimeout(() => setShake(null), 260);
      return;
    }
    onChange([...selected, tag]);
    play("pop");
  };

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
          Temas · elige hasta {max}
        </span>
        <span className="font-mono text-[12px] text-text-2">
          {selected.length} / {max}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(tag)}
              className={cn(
                "rounded-pill border px-[14px] py-[6px] font-sans text-[13px] transition-[transform,background-color,color,border-color] duration-150 ease-flow",
                active
                  ? "border-ink bg-ink font-semibold text-ink-on"
                  : "border-line-2 font-medium text-text-2 hover:border-ink hover:text-ink",
                shake === tag && "[animation:fp-shake_.26s_ease]",
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
