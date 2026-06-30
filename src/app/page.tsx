"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlowMark } from "@/components/brand";
import { Button } from "@/components/ui";
import { ThemeToggle, SoundToggle, LangToggle } from "@/components/chrome";
import { useI18n } from "@/providers/I18nProvider";

// Landing de fundación: muestra que la marca, los tokens y los providers viven.
// Se reemplazará por la portada/El Pub reales en sus fases.
export default function Home() {
  const { t } = useI18n();

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
      <div className="absolute right-5 top-5 flex items-center gap-2">
        <LangToggle />
        <SoundToggle />
        <ThemeToggle />
      </div>

      <FlowMark size={76} strokeWidth={13} breathe className="mb-8 text-ink" />

      <h1 className="font-serif text-[clamp(44px,9vw,76px)] font-normal leading-[1.02] tracking-[-0.02em] text-ink">
        <span className="italic">Flow</span>Pub
      </h1>

      <p className="mt-5 max-w-md font-sans text-[17px] leading-relaxed text-text-2">
        {t("tagline")}
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" sound="rec">
          {t("record")}
        </Button>
        <Link
          href="/styleguide"
          className="inline-flex h-12 items-center gap-2 rounded-pill border border-line-2 px-6 font-sans text-[15px] font-semibold text-ink transition-colors duration-150 ease-flow hover:bg-[var(--hover)]"
        >
          Styleguide
          <ArrowRight size={16} />
        </Link>
      </div>

      <p className="mt-16 font-mono text-[12px] text-text-3">
        flowpub.lat · fundación
      </p>
    </main>
  );
}
