"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { useRecorder } from "@/lib/useRecorder";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { saveVoiceIntro } from "@/data/profileApi";

// Presentación por voz del perfil: la persona se presenta HABLANDO, y eso vive
// arriba de su bio. Sin transcript ni pulido a propósito — no es un Flow, es su
// voz cruda diciendo quién es. Tope de 1 minuto: una presentación, no una
// cátedra.
//
// Quien visita solo ve el reproductor. El dueño ve, además, grabar / regrabar /
// quitar. Si la migración 27 no ha corrido (`enabled=false`), la UI de grabar
// ni se ofrece: no tendría dónde guardarse.

const MAX_SECONDS = 60;

export function VoiceIntro({
  audioUrl,
  durationSeconds,
  isOwn,
  enabled,
}: {
  audioUrl: string | null;
  durationSeconds: number;
  isOwn: boolean;
  /** ¿La lectura trajo las columnas de la presentación (migración 27)? */
  enabled: boolean;
}) {
  const { t } = useI18n();
  const { play } = useSound();
  const router = useRouter();
  const recorder = useRecorder(MAX_SECONDS);

  const [url, setUrl] = useState(audioUrl);
  const [secs, setSecs] = useState(durationSeconds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveLock = useRef(false);

  // El servidor manda: tras router.refresh() gana lo que trajo.
  useEffect(() => {
    setUrl(audioUrl);
    setSecs(durationSeconds);
  }, [audioUrl, durationSeconds]);

  // Un solo guardado a la vez, y el candado sobrevive a re-renders.
  const persist = async (blob: Blob | null, duration: number) => {
    if (saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setError(null);
    try {
      const res = await saveVoiceIntro(blob, duration);
      if (res.pending) {
        setError(t("intro.err.pending"));
        return;
      }
      if (!res.ok) {
        setError(t("intro.err.save"));
        return;
      }
      setUrl(res.url ?? null);
      setSecs(blob ? Math.round(duration) : 0);
      play("pop");
      router.refresh();
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };

  const startRec = async () => {
    setError(null);
    play("rec");
    const ok = await recorder.start();
    if (!ok) setError(recorder.error ?? t("intro.err.mic"));
  };

  const stopRec = async () => {
    const out = await recorder.stop();
    recorder.reset();
    if (!out || out.durationSeconds < 1) {
      setError(t("intro.err.short"));
      return;
    }
    await persist(out.blob, out.durationSeconds);
  };

  const remove = async () => {
    play("soft");
    await persist(null, 0);
  };

  // Nada que mostrar: sin audio y sin permiso de grabar (visitante).
  if (!url && !(isOwn && enabled)) return null;

  return (
    <div className="mt-4">
      {recorder.recording ? (
        <div className="flex items-center gap-3 rounded-[14px] border border-line bg-surface px-4 py-3">
          <span
            aria-hidden
            className="h-2.5 w-2.5 flex-none rounded-pill bg-grana [animation:fp-breathe_1.6s_ease-in-out_infinite]"
          />
          <span className="font-mono text-[13px] text-ink">
            {formatSecs(recorder.elapsed)} / {formatSecs(MAX_SECONDS)}
          </span>
          <span className="min-w-0 flex-1 truncate font-sans text-[13px] text-text-2">
            {t("intro.recording")}
          </span>
          <button
            type="button"
            onClick={stopRec}
            className="fp-hit-y flex flex-none items-center gap-1.5 rounded-pill bg-grana px-3.5 py-1.5 font-sans text-[13px] font-semibold text-[var(--grana-text-on-dark)] transition-colors hover:bg-grana-700"
          >
            <Square size={13} />
            {t("intro.stop")}
          </button>
        </div>
      ) : url ? (
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-2">
              {t(isOwn ? "intro.labelOwn" : "intro.label")}
            </p>
            <AudioPlayer src={url} durationSeconds={secs} variant="mini" />
          </div>
          {isOwn && enabled && (
            <div className="flex flex-none items-center gap-1 self-end">
              <button
                type="button"
                onClick={startRec}
                disabled={saving}
                aria-label={t("intro.rerecord")}
                title={t("intro.rerecord")}
                className="fp-hit-y grid h-9 w-9 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink disabled:opacity-50"
              >
                <Mic size={16} />
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={saving}
                aria-label={t("intro.remove")}
                title={t("intro.remove")}
                className="fp-hit-y grid h-9 w-9 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={startRec}
          disabled={saving}
          className={cn(
            "fp-hit-y inline-flex items-center gap-2 rounded-pill border border-line-2 px-3.5 py-1.5",
            "font-sans text-[13px] font-medium text-ink transition-colors",
            "hover:border-ink hover:bg-[var(--hover)] disabled:opacity-50",
          )}
        >
          <Mic size={15} />
          {saving ? t("intro.saving") : t("intro.cta")}
        </button>
      )}

      {error && (
        <p role="status" className="mt-2 font-sans text-[12.5px] text-grana">
          {error}
        </p>
      )}
    </div>
  );
}

function formatSecs(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
}
