"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { Chip } from "@/components/ui";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { tagName, type TagRow } from "@/data/tags";
import { formatDuration } from "@/lib/format";

/** Cortes del filtro de duración (segundos). null = cualquier duración. */
export const DURATION_STEPS = [15, 30, 60, 90, 120, 150, 180] as const;

/**
 * Barra de filtros del Pub: los temas viven en un riel deslizable (una sola
 * línea, con desvanecido en los bordes — ya no se aprietan) y la duración en
 * un menú compacto anclado a la derecha.
 */
export function TagFilter({
  tags,
  active,
  onChange,
  duration,
  onDurationChange,
}: {
  tags: TagRow[];
  /** "all" o el slug del tema activo. */
  active: string;
  onChange: (slug: string) => void;
  duration: number | null;
  onDurationChange: (d: number | null) => void;
}) {
  const { t, lang } = useI18n();

  return (
    <div className="glass sticky top-[56px] z-10 border-b border-line-soft lg:top-0">
      <div className="flex items-center pr-3 lg:pr-5">
        <div className="min-w-0 flex-1 overflow-x-auto px-4 py-3.5 lg:px-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_18px,black_calc(100%-26px),transparent)]">
          <div className="flex w-max items-center gap-2">
            <Chip
              active={active === "all"}
              onClick={() => onChange("all")}
              className="flex-none"
            >
              {t("filter.all")}
            </Chip>
            {tags.map((tag) => (
              <Chip
                key={tag.slug}
                active={active === tag.slug}
                onClick={() => onChange(tag.slug)}
                className="flex-none"
              >
                {tagName(tag, lang)}
              </Chip>
            ))}
          </div>
        </div>
        <span className="mx-1 h-6 w-px flex-none bg-line" aria-hidden />
        <DurationMenu value={duration} onChange={onDurationChange} />
      </div>
    </div>
  );
}

function DurationMenu({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (d: number | null) => void;
}) {
  const { t } = useI18n();
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex-none">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("filter.duration")}
        onClick={() => {
          setOpen((o) => !o);
          play("tick");
        }}
        className={cn(
          "flex h-[34px] items-center gap-1.5 rounded-pill border px-3.5 font-sans text-[13px] transition-colors duration-150 ease-flow",
          value !== null
            ? "border-ink bg-ink font-semibold text-ink-on"
            : "border-line-2 font-medium text-text-2 hover:border-ink hover:text-ink",
        )}
      >
        <Clock size={14} />
        {value === null ? (
          t("filter.duration")
        ) : (
          <span className="font-mono text-[12px] tabular-nums">
            ≤ {formatDuration(value)}
          </span>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("filter.duration")}
          className="absolute right-0 top-[calc(100%+8px)] z-20 flex w-[200px] flex-col rounded-[14px] border border-line bg-surface p-1.5 shadow-[var(--shadow-hover)]"
        >
          <DurationOption
            selected={value === null}
            onSelect={() => {
              onChange(null);
              setOpen(false);
              play("soft");
            }}
          >
            {t("filter.anyDuration")}
          </DurationOption>
          {DURATION_STEPS.map((s) => (
            <DurationOption
              key={s}
              selected={value === s}
              onSelect={() => {
                onChange(s);
                setOpen(false);
                play("pop");
              }}
            >
              <span className="font-mono text-[13px] tabular-nums">
                ≤ {formatDuration(s)}
              </span>
            </DurationOption>
          ))}
        </div>
      )}
    </div>
  );
}

function DurationOption({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between rounded-[10px] px-3 py-2 text-left font-sans text-[14px] transition-colors hover-tint",
        selected ? "font-semibold text-ink" : "text-text-2",
      )}
    >
      {children}
      {selected && <Check size={14} aria-hidden />}
    </button>
  );
}
