"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Cookie } from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { LEGAL, LEGAL_ORDER, type LegalId } from "@/lib/legal";
import type { DictKey } from "@/lib/i18n/dictionaries";

// Un solo lugar para lo legal (inspirado en Gulu): el modal con tabs se abre
// desde el aviso de cookies, el menú del avatar, el riel y el onboarding.

interface LegalCtx {
  openLegal: (doc: LegalId) => void;
}

const Ctx = createContext<LegalCtx>({ openLegal: () => {} });

const TAB_KEY: Record<LegalId, DictKey> = {
  terminos: "legal.terms",
  privacidad: "legal.privacy",
  cookies: "legal.cookies",
};

const CONSENT_KEY = "fp-consent";

export function LegalProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { play } = useSound();
  const [doc, setDoc] = useState<LegalId | null>(null);
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setShowConsent(true);
    } catch {
      /* noop */
    }
  }, []);

  const openLegal = useCallback(
    (d: LegalId) => {
      play("tick");
      setDoc(d);
    },
    [play],
  );

  const acceptConsent = () => {
    play("pop");
    setShowConsent(false);
    try {
      localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    } catch {
      /* noop */
    }
  };

  const active = doc ? LEGAL[doc] : null;

  return (
    <Ctx.Provider value={{ openLegal }}>
      {children}

      {/* visor legal con tabs */}
      <Modal
        open={!!active}
        onClose={() => setDoc(null)}
        className="flex max-h-[86vh] w-[640px] flex-col"
      >
        <div className="flex gap-1 border-b border-line">
          {LEGAL_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                play("tick");
                setDoc(id);
              }}
              className={cn(
                "-mb-px border-b-2 px-3 pb-2.5 font-sans text-[14px] transition-colors duration-150",
                doc === id
                  ? "border-grana font-semibold text-ink"
                  : "border-transparent font-medium text-text-3 hover:text-ink",
              )}
            >
              {t(TAB_KEY[id])}
            </button>
          ))}
        </div>
        {active && (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 pt-4">
            <h2 className="font-serif text-[24px] font-medium leading-[1.15] text-ink">
              {active.title}
            </h2>
            <p className="mt-1 font-mono text-[11px] text-text-3">
              {active.updated}
            </p>
            {active.sections.map((sec, i) => (
              <section key={i} className="mt-4">
                {sec.h && (
                  <h3 className="mb-1.5 font-sans text-[13px] font-semibold text-ink">
                    {sec.h}
                  </h3>
                )}
                {sec.p.map((para, j) => (
                  <p
                    key={j}
                    className="mb-2 font-serif text-[14.5px] leading-[1.6] text-text-2"
                  >
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>
        )}
      </Modal>

      {/* aviso de cookies (primera visita): solo esenciales, aviso informativo */}
      {showConsent && (
        <div
          role="region"
          aria-label={t("consent.aria")}
          className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-4 [animation:fp-rise_.32s_var(--ease-flow)]"
        >
          <div className="glass flex max-w-[560px] flex-wrap items-center gap-x-3 gap-y-2 rounded-[16px] border border-line px-4 py-3 shadow-[var(--shadow-hover)]">
            <Cookie size={16} className="flex-none text-text-3" aria-hidden />
            <p className="min-w-0 flex-1 font-sans text-[12.5px] leading-snug text-text-2">
              {t("consent.text")}{" "}
              <button
                type="button"
                onClick={() => openLegal("cookies")}
                className="font-semibold text-ink underline underline-offset-2 hover:text-grana-text"
              >
                {t("consent.more")}
              </button>
            </p>
            <button
              type="button"
              onClick={acceptConsent}
              className="flex-none rounded-pill bg-ink px-4 py-1.5 font-sans text-[12px] font-semibold text-ink-on transition-transform duration-150 ease-flow active:scale-[.96]"
            >
              {t("consent.ok")}
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useLegal() {
  return useContext(Ctx);
}
