"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTheme } from "@/providers/ThemeProvider";
import { useSound } from "@/providers/SoundProvider";
import { useI18n } from "@/providers/I18nProvider";

/** Pastilla claro/oscuro (como en el chrome de El Pub). */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setPref } = useTheme();
  const { play } = useSound();
  const { t } = useI18n();

  const items: { v: "light" | "dark"; label: string; Icon: typeof Sun }[] = [
    { v: "light", label: t("theme.light"), Icon: Sun },
    { v: "dark", label: t("theme.dark"), Icon: Moon },
  ];

  return (
    <div
      role="group"
      aria-label="Tema"
      className={cn(
        "inline-flex items-center rounded-pill border border-line-2 bg-surface p-[3px]",
        className,
      )}
    >
      {items.map(({ v, label, Icon }) => (
        <button
          key={v}
          type="button"
          aria-label={label}
          aria-pressed={theme === v}
          onClick={() => {
            setPref(v);
            play("tick");
          }}
          className={cn(
            "fp-hit-y grid h-[30px] w-9 place-items-center rounded-pill transition-colors duration-150 ease-flow",
            theme === v ? "bg-ink text-ink-on" : "text-text-2 hover:text-ink",
          )}
        >
          <Icon size={15} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
