"use client";

import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { FlowMark } from "@/components/brand";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";

// Ofrece instalar FlowPub como app (beforeinstallprompt + manifest). Si la
// descartan, vuelve a ofrecerse cada 3 visitas — insistente pero educada.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const K_VISITS = "fp-visits";
const K_DISMISSED_AT = "fp-install-dismissed-at";
const K_INSTALLED = "fp-installed";

function countVisit(): number {
  try {
    let visits = Number(localStorage.getItem(K_VISITS) ?? "0");
    // Una visita por sesión de navegador, no por navegación interna.
    if (!sessionStorage.getItem("fp-visit-counted")) {
      visits += 1;
      localStorage.setItem(K_VISITS, String(visits));
      sessionStorage.setItem("fp-visit-counted", "1");
    }
    return visits;
  } catch {
    return 0;
  }
}

export function InstallPrompt() {
  const { t } = useI18n();
  const { play } = useSound();
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let installed = false;
    try {
      installed =
        localStorage.getItem(K_INSTALLED) === "1" ||
        window.matchMedia("(display-mode: standalone)").matches;
    } catch {
      /* noop */
    }
    if (installed) return;

    const visits = countVisit();

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      try {
        const dismissedAt = localStorage.getItem(K_DISMISSED_AT);
        // Primera vez: se ofrece. Tras descartar: cada 3 visitas.
        if (dismissedAt === null || visits - Number(dismissedAt) >= 3) {
          setShow(true);
        }
      } catch {
        setShow(true);
      }
    };

    const onInstalled = () => {
      try {
        localStorage.setItem(K_INSTALLED, "1");
      } catch {
        /* noop */
      }
      setShow(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    play("soft");
    setShow(false);
    try {
      localStorage.setItem(K_DISMISSED_AT, localStorage.getItem(K_VISITS) ?? "0");
    } catch {
      /* noop */
    }
  };

  const install = async () => {
    const ev = deferred.current;
    if (!ev) return;
    play("pop");
    setShow(false);
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    if (outcome === "accepted") {
      try {
        localStorage.setItem(K_INSTALLED, "1");
      } catch {
        /* noop */
      }
    } else {
      try {
        localStorage.setItem(K_DISMISSED_AT, localStorage.getItem(K_VISITS) ?? "0");
      } catch {
        /* noop */
      }
    }
    deferred.current = null;
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label={t("pwa.title")}
      className="fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-6 [animation:fp-rise_.32s_var(--ease-flow)]"
    >
      <div className="glass flex items-center gap-3 rounded-[16px] border border-line px-4 py-3 shadow-[var(--shadow-hover)]">
        <FlowMark size={26} intro={false} className="flex-none text-ink" />
        <span className="font-sans text-[13px] font-medium leading-snug text-ink">
          {t("pwa.title")}
        </span>
        <button
          type="button"
          onClick={() => void install()}
          className="flex flex-none items-center gap-1.5 rounded-pill bg-grana px-3.5 py-1.5 font-sans text-[12px] font-semibold text-white transition-colors hover:bg-grana-700"
        >
          <Download size={13} />
          {t("pwa.install")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("pwa.dismiss")}
          className="grid h-8 w-8 flex-none place-items-center rounded-pill text-text-3 transition-colors hover:bg-[var(--hover)] hover:text-ink"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
