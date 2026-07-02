"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";

// Vigila la versión del deploy: al volver a la pestaña (y cada 15 min) compara
// el SHA con el del primer render; si cambió, ofrece recargar. Así nadie se
// queda con chunks viejos tras un deploy.

const POLL_MS = 15 * 60 * 1000;

async function fetchVersion(): Promise<string | null> {
  try {
    const r = await fetch("/api/version", { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j?.v === "string" ? j.v : null;
  } catch {
    return null;
  }
}

export function VersionWatcher() {
  const { t } = useI18n();
  const baseline = useRef<string | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let alive = true;

    const check = async () => {
      const v = await fetchVersion();
      if (!alive || !v || v === "dev") return;
      if (baseline.current === null) {
        baseline.current = v;
      } else if (v !== baseline.current) {
        setStale(true);
      }
    };

    void check();
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    const id = window.setInterval(check, POLL_MS);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(id);
    };
  }, []);

  if (!stale) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-6 [animation:fp-rise_.32s_var(--ease-flow)]"
    >
      <div className="glass flex items-center gap-3 rounded-pill border border-line px-4 py-2 shadow-[var(--shadow-hover)]">
        <span className="font-sans text-[13px] font-medium text-ink">
          {t("version.new")}
        </span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 rounded-pill bg-ink px-3.5 py-1.5 font-sans text-[12px] font-semibold text-ink-on transition-transform duration-150 ease-flow active:scale-[.96]"
        >
          <RefreshCw size={13} />
          {t("version.reload")}
        </button>
      </div>
    </div>
  );
}
