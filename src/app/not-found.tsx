"use client";

import Link from "next/link";
import { FlowMark } from "@/components/brand";
import { useI18n } from "@/providers/I18nProvider";

// 404 de marca: cálido y con salida clara al Pub (nada de pantalla gris de Next).
export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <FlowMark size={56} draw className="text-text-2" />
        <p className="mt-7 font-mono text-[13px] tabular-nums text-text-2">404</p>
        <h1 className="mt-2 font-serif text-[34px] leading-tight text-ink">
          {t("nf.title")}
        </h1>
        <p className="mt-3 font-sans text-[15px] leading-relaxed text-text-2">
          {t("nf.body")}
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center rounded-pill bg-grana px-6 font-sans text-[15px] font-semibold text-white transition-colors hover:bg-grana-700"
        >
          {t("nf.cta")}
        </Link>
      </div>
    </main>
  );
}
