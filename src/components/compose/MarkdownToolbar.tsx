"use client";

import type { RefObject } from "react";
import { Bold, Heading2, Italic, Link2, List, Quote } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";

type ToolKind = "h2" | "bold" | "italic" | "quote" | "ul" | "link";

const TOOLS: { kind: ToolKind; Icon: typeof Bold; label: string }[] = [
  { kind: "h2", Icon: Heading2, label: "Subtítulo" },
  { kind: "bold", Icon: Bold, label: "Negrita" },
  { kind: "italic", Icon: Italic, label: "Itálica" },
  { kind: "quote", Icon: Quote, label: "Cita" },
  { kind: "ul", Icon: List, label: "Lista" },
  { kind: "link", Icon: Link2, label: "Enlace" },
];

export function MarkdownToolbar({
  textareaRef,
  value,
  onChange,
  className,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const { play } = useSound();

  const apply = (kind: ToolKind) => {
    play("tick");
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const sel = value.slice(s, e);

    let next: string;
    let caret: number;

    if (kind === "bold" || kind === "italic" || kind === "link") {
      const ins =
        kind === "bold"
          ? `**${sel || "negrita"}**`
          : kind === "italic"
            ? `*${sel || "itálica"}*`
            : `[${sel || "texto"}](url)`;
      next = value.slice(0, s) + ins + value.slice(e);
      caret = s + ins.length;
    } else {
      const prefix = kind === "h2" ? "## " : kind === "quote" ? "> " : "- ";
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
      caret = e + prefix.length;
    }

    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-[10px] border border-line bg-surface-2 p-1",
        className,
      )}
    >
      {TOOLS.map(({ kind, Icon, label }) => (
        <button
          key={kind}
          type="button"
          aria-label={label}
          title={label}
          onClick={() => apply(kind)}
          className="grid h-8 w-8 place-items-center rounded-md text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
