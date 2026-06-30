"use client";

import { cn } from "@/lib/cn";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";

const OPTS = [
  { v: "auto", label: "Auto" },
  { v: "es", label: "ES" },
  { v: "en", label: "EN" },
] as const;

/** Segmento Auto/ES/EN — traduce solo el chrome. */
export function LangToggle({ className }: { className?: string }) {
  const { pref, setLang } = useI18n();
  const { play } = useSound();

  return (
    <div
      role="group"
      aria-label="Idioma"
      className={cn(
        "inline-flex items-center rounded-pill border border-line-2 bg-surface p-[3px]",
        className,
      )}
    >
      {OPTS.map((o) => (
        <button
          key={o.v}
          type="button"
          aria-pressed={pref === o.v}
          onClick={() => {
            setLang(o.v);
            play("tick");
          }}
          className={cn(
            "h-[30px] rounded-pill px-3 font-sans text-[12px] font-semibold transition-colors duration-150 ease-flow",
            pref === o.v ? "bg-ink text-ink-on" : "text-text-3 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
