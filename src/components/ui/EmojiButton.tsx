"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Smile } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";
import { useI18n } from "@/providers/I18nProvider";

// Selector de emojis (desktop): inserta en el caret de un input/textarea. Es
// para el CONTENIDO del usuario (Flow, comentario, mensaje) — el chrome de la
// app sigue sin emoji, per CLAUDE.md. Set curado (sin dependencias externas);
// en móvil se oculta porque el teclado del sistema ya trae emojis.

const GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Caras",
    emojis: ["😀", "😄", "😁", "😊", "🙂", "😉", "😍", "🥰", "😘", "😎", "🤩", "🥳", "😇", "🙃", "😌", "😴", "🤔", "😅", "😂", "🤣", "😭", "😢", "😤", "😳", "😬", "🙄", "😏", "😜", "🤯", "🥺"],
  },
  {
    label: "Gestos",
    emojis: ["👍", "👎", "👏", "🙌", "🙏", "👋", "🤝", "✌️", "🤟", "🤙", "💪", "🫶", "👀", "🧠", "👑", "🫡"],
  },
  {
    label: "Corazones",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💖", "💗", "💕", "💞", "💔", "❣️"],
  },
  {
    label: "Fiesta",
    emojis: ["🎉", "🎊", "✨", "🌟", "⭐", "💫", "🔥", "💯", "🚀", "🎈", "🎁", "🏆", "🥇", "🎶", "🎵", "🎤"],
  },
  {
    label: "Naturaleza",
    emojis: ["🌱", "🌿", "🍀", "🌸", "🌺", "🌻", "🌙", "☀️", "⛅", "🌈", "🌊", "🏔️", "🐶", "🐱", "🦋", "🌎"],
  },
  {
    label: "Comida",
    emojis: ["☕", "🍵", "🍺", "🍷", "🌮", "🍕", "🍔", "🍎", "🍓", "🥑", "🍰", "🍫", "🍦", "🌶️", "🧉", "🍩"],
  },
  {
    label: "Objetos",
    emojis: ["🎨", "📚", "✍️", "🎧", "🎬", "📷", "🎙️", "💡", "🔔", "📌", "💬", "✅", "⚡", "🕊️", "🗿", "🎭"],
  },
];

// Unión de refs (no RefObject<A|B>): RefObject es invariante en su `current`,
// así que un ref de textarea NO encaja en RefObject<textarea|input>.
type Target =
  | RefObject<HTMLTextAreaElement | null>
  | RefObject<HTMLInputElement | null>;

export function EmojiButton({
  targetRef,
  value,
  onChange,
  className,
}: {
  targetRef: Target;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const { play } = useSound();
  const { t } = useI18n();
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

  const insert = (emoji: string) => {
    play("tick");
    const el = targetRef.current;
    // Sin foco/selección conocida, agrega al final.
    const s = el?.selectionStart ?? value.length;
    const e = el?.selectionEnd ?? value.length;
    const next = value.slice(0, s) + emoji + value.slice(e);
    onChange(next);
    const caret = s + emoji.length;
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      try {
        el.setSelectionRange(caret, caret);
      } catch {
        /* algunos input types no soportan selección */
      }
    });
  };

  // Oculto en móvil (el teclado del sistema ya trae emojis).
  return (
    <div ref={rootRef} className={cn("relative hidden md:block", className)}>
      <button
        type="button"
        aria-label={t("emoji.aria")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          play("tick");
          setOpen((o) => !o);
        }}
        className="fp-hit-y grid h-8 w-8 place-items-center rounded-md text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
      >
        <Smile size={16} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("emoji.aria")}
          className="absolute bottom-full right-0 z-40 mb-2 max-h-[280px] w-[288px] overflow-y-auto rounded-[14px] border border-line bg-surface p-2 shadow-[var(--shadow-hover)] [animation:fp-rise_.16s_var(--ease-flow)]"
        >
          {GROUPS.map((g) => (
            <div key={g.label} className="mb-1.5 last:mb-0">
              <p className="px-1 pb-1 pt-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-text-3">
                {g.label}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {g.emojis.map((emoji, i) => (
                  <button
                    key={`${g.label}-${i}`}
                    type="button"
                    aria-label={emoji}
                    onClick={() => insert(emoji)}
                    className="grid h-8 w-8 place-items-center rounded-md text-[19px] leading-none transition-colors hover:bg-[var(--hover)]"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
