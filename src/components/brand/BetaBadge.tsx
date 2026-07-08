"use client";

import { cn } from "@/lib/cn";
import { useI18n } from "@/providers/I18nProvider";

export interface BetaBadgeProps {
  className?: string;
}

/**
 * Letrero «beta»: pill discreto que avisa que FlowPub está en versión beta.
 * Marca-de-versión → tipografía mono (los «datos»), en tono neutral (nunca
 * grana, que está reservado). Solo tokens; sin emoji. Legible en claro y oscuro
 * (text-2 sobre surface-2 cumple AA para texto chico, igual que el resto del
 * chrome informativo). La palabra «beta» es universal ES/EN; solo el tooltip
 * accesible se traduce.
 */
export function BetaBadge({ className }: BetaBadgeProps) {
  const { t } = useI18n();
  return (
    // Sin aria-label: el texto visible «beta» ES el nombre accesible (una frase
    // en aria-label contaminaría el nombre del link contenedor). La frase queda
    // como `title` (tooltip para quien pasa el mouse).
    <span
      title={t("beta.title")}
      className={cn(
        "select-none rounded-pill border border-line-2 bg-surface-2 px-1.5 py-[3px] font-mono text-[9px] font-bold uppercase leading-none tracking-[0.16em] text-text-2",
        className,
      )}
    >
      beta
    </span>
  );
}
