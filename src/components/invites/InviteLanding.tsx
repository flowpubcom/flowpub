"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import { Logo } from "@/components/brand";
import { useI18n } from "@/providers/I18nProvider";
import type { InviteInfo } from "@/data/invitesApi";

/** Landing de una invitación (/i/CODIGO). Si está viva, guarda el código y
 *  manda al onboarding: el canje ocurre al terminar de crear la cuenta. */
export function InviteLanding({
  code,
  info,
}: {
  code: string;
  info: InviteInfo;
}) {
  const { t } = useI18n();

  // El código viaja en localStorage: sobrevive el OAuth redirect de Google.
  useEffect(() => {
    if (!info.available) return;
    try {
      localStorage.setItem("fp-invite", code);
    } catch {
      /* noop */
    }
  }, [code, info.available]);

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-[440px] rounded-[20px] border border-line bg-surface p-8 text-center shadow-[var(--shadow-window)]">
        <div className="flex justify-center">
          <Logo markSize={30} textSize={23} />
        </div>

        <p className="mt-7 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
          {t("invite.landing.eyebrow")}
        </p>

        <div className="mt-5 flex justify-center">
          <Avatar name={info.displayName} src={info.avatarUrl} size={72} />
        </div>

        {info.available ? (
          <>
            <h1 className="mt-4 font-serif text-[28px] font-medium leading-[1.15] text-ink">
              {t("invite.landing.title", { name: info.displayName })}
            </h1>
            <p className="mx-auto mt-3 max-w-[36ch] font-sans text-[14px] leading-relaxed text-text-2">
              {t("invite.landing.body")}
            </p>
            <Link
              href={`/entrar?invite=${encodeURIComponent(code)}`}
              className="mt-7 inline-flex h-12 items-center justify-center rounded-pill bg-grana px-8 font-sans text-[15px] font-semibold text-white shadow-[var(--shadow-grana)] transition-transform duration-150 ease-flow active:scale-[.97]"
            >
              {t("invite.landing.cta")}
            </Link>
            <p className="mt-4">
              <Link
                href="/"
                className="font-sans text-[13px] font-medium text-text-3 transition-colors hover:text-ink"
              >
                {t("invite.landing.listen")}
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-4 font-serif text-[24px] font-medium leading-[1.2] text-ink">
              {t("invite.landing.used")}
            </h1>
            <p className="mx-auto mt-2 max-w-[36ch] font-sans text-[14px] text-text-2">
              {t("invite.landing.usedHint")}
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-pill border border-ink px-6 font-sans text-[14px] font-semibold text-ink transition-colors duration-150 ease-flow hover:bg-ink hover:text-ink-on"
            >
              {t("invite.landing.listen")}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
