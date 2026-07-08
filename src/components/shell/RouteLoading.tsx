"use client";

import { FlowMark } from "@/components/brand";
import { useI18n } from "@/providers/I18nProvider";

// Estado de carga de ruta (App Router loading.tsx): la vírgula respirando en
// vez de pantalla en blanco. Reduced-motion apaga la animación (globals.css).
export function RouteLoading() {
  const { t } = useI18n();
  return (
    <div
      role="status"
      aria-label={t("loading")}
      className="grid min-h-dvh place-items-center"
    >
      <FlowMark size={48} breathe className="text-text-2" />
    </div>
  );
}
