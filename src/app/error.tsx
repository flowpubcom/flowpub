"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FlowMark } from "@/components/brand";
import { useI18n } from "@/providers/I18nProvider";

// Boundary de errores de la app (dentro del layout raíz, con providers vivos).
// Cálido, sin jerga, con reintento — el detalle queda en la consola/logs.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    // Vercel captura stderr; el digest permite cruzar con los logs del server.
    console.error("[app-error]", error.digest ?? "", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <FlowMark size={56} className="text-text-2" />
        <h1 className="mt-7 font-serif text-[34px] leading-tight text-ink">
          {t("err.title")}
        </h1>
        <p className="mt-3 font-sans text-[15px] leading-relaxed text-text-2">
          {t("err.body")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center rounded-pill bg-grana px-6 font-sans text-[15px] font-semibold text-white transition-colors hover:bg-grana-700"
          >
            {t("err.retry")}
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-pill border border-line-2 px-6 font-sans text-[15px] font-semibold text-ink transition-colors hover:bg-[var(--hover)]"
          >
            {t("err.home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
