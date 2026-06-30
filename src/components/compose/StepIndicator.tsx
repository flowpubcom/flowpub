import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = ["Grabar", "Pulir", "Editar", "Publicar"];

/** Indicador de pasos: Grabar ✓ · Pulir ✓ · Editar • · Publicar. */
export function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-5 w-5 place-items-center rounded-pill font-mono text-[11px] transition-colors",
                done && "bg-ink text-ink-on",
                active && "bg-grana text-white",
                !done && !active && "border border-line-2 text-text-3",
              )}
            >
              {done ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn(
                "font-sans text-[13px]",
                active ? "font-semibold text-ink" : "text-text-3",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 h-px w-5 bg-line-2" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
