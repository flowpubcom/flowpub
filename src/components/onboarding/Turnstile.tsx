"use client";

import { useEffect, useRef } from "react";

// Widget de Cloudflare Turnstile. Solo se muestra si hay site key pública; si no
// (dev sin Turnstile), no renderiza y la auth sigue sin captcha. El token se pasa
// a supabase.auth (CAPTCHA protection se habilita en el dashboard de Supabase con
// la secret key). Token de un solo uso: `reset()` lo regenera tras un fallo.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          theme?: "auto" | "light" | "dark";
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Expone `resetRef` para regenerar el token tras un intento fallido. */
export function Turnstile({
  onToken,
  resetRef,
}: {
  onToken: (token: string | null) => void;
  resetRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    void loadScript().then(() => {
      if (cancelled || !boxRef.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(boxRef.current, {
        sitekey: SITE_KEY,
        theme: "auto",
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
      if (resetRef) {
        resetRef.current = () => {
          onToken(null);
          window.turnstile?.reset(widgetId.current ?? undefined);
        };
      }
    });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={boxRef} className="min-h-[65px]" />;
}

/** ¿Hay captcha configurado? (para gatear el submit). */
export const captchaEnabled = !!SITE_KEY;
