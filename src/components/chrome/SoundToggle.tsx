"use client";

import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";
import { useI18n } from "@/providers/I18nProvider";

/** Mute global del sonido de interfaz (obligatorio por a11y). */
export function SoundToggle({ className }: { className?: string }) {
  const { muted, toggleMuted } = useSound();
  const { t } = useI18n();
  const Icon = muted ? VolumeX : Volume2;

  return (
    <button
      type="button"
      aria-pressed={!muted}
      aria-label={muted ? t("sound.off") : t("sound.on")}
      onClick={toggleMuted}
      className={cn(
        "fp-hit grid h-9 w-9 place-items-center rounded-pill border border-line-2 bg-surface text-text-2 transition-colors duration-150 ease-flow hover:text-ink",
        className,
      )}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}
