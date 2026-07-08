"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";
import { useI18n } from "@/providers/I18nProvider";
import { CATEGORIES } from "@/data/mock";
import { createTag } from "@/data/tagsClient";

export function TagPicker({
  selected,
  onChange,
  max = 3,
  options = CATEGORIES,
  allowCreate = false,
  onCreated,
  className,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  options?: string[];
  /** Muestra la opción «Crear tema» (inserta en la BD y lo selecciona). */
  allowCreate?: boolean;
  /** Avisa al padre del tema recién creado (para sumarlo a su lista, si lleva). */
  onCreated?: (name: string) => void;
  className?: string;
}) {
  const { play } = useSound();
  const { t } = useI18n();
  const [shake, setShake] = useState<string | null>(null);
  // Temas creados en esta sesión (para que aparezcan de inmediato como chips).
  const [extra, setExtra] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Muestra las opciones + los creados + cualquier seleccionado (por si un tema
  // del Flow ya no está en la lista activa, que igual se vea como chip).
  const allOptions = useMemo(
    () => [...new Set([...options, ...extra, ...selected])],
    [options, extra, selected],
  );

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((tg) => tg !== tag));
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

  const submitCreate = async () => {
    const name = draft.trim();
    if (busy) return;
    setError(null);
    if (name.length < 3 || name.length > 24) {
      setError(t("tag.createInvalid"));
      play("soft");
      return;
    }
    setBusy(true);
    const res = await createTag(name);
    setBusy(false);
    if (!res.ok) {
      setError(t(res.reason === "denied" ? "tag.createDisabled" : "tag.createError"));
      play("soft");
      return;
    }
    // Aparece para todos (está en la BD); acá lo sumamos como chip y lo elegimos.
    setExtra((prev) => (prev.includes(res.name) ? prev : [...prev, res.name]));
    onCreated?.(res.name);
    if (!selected.includes(res.name) && selected.length < max) {
      onChange([...selected, res.name]);
    }
    play("pop");
    setDraft("");
    setCreating(false);
    setError(null);
  };

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-2">
          {t("tag.pickTitle")} · {t("tag.pickUpTo")} {max}
        </span>
        <span className="font-mono text-[12px] text-text-2">
          {selected.length} / {max}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {allOptions.map((tag) => {
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

        {allowCreate && !creating && (
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setError(null);
              play("click");
            }}
            className="inline-flex items-center gap-1.5 rounded-pill border border-dashed border-line-2 px-[14px] py-[6px] font-sans text-[13px] font-medium text-text-2 transition-colors hover:border-ink hover:text-ink"
          >
            <Plus size={14} />
            {t("tag.create")}
          </button>
        )}
      </div>

      {allowCreate && creating && (
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={draft}
              autoFocus
              maxLength={24}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitCreate();
                } else if (e.key === "Escape") {
                  setCreating(false);
                  setError(null);
                }
              }}
              placeholder={t("tag.createPlaceholder")}
              aria-label={t("tag.createPlaceholder")}
              className="w-[220px] rounded-pill border border-line-2 bg-surface px-4 py-2 font-sans text-[14px] text-ink outline-none focus:border-grana"
            />
            <button
              type="button"
              onClick={() => void submitCreate()}
              disabled={busy || draft.trim().length < 3}
              className="inline-flex h-[38px] items-center gap-1.5 rounded-pill bg-grana px-4 font-sans text-[13px] font-semibold text-white transition-colors hover:bg-grana-700 disabled:opacity-40"
            >
              {busy ? t("tag.creating") : t("tag.createCta")}
            </button>
            <button
              type="button"
              aria-label={t("common.cancel")}
              onClick={() => {
                setCreating(false);
                setError(null);
                play("soft");
              }}
              className="grid h-[38px] w-[38px] place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
          {error && (
            <p role="status" className="mt-2 font-sans text-[13px] text-grana">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
