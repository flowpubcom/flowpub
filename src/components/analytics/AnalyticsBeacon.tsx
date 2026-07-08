"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Beacon de analítica propia: manda una «vista» al cambiar de ruta. Privacy-first:
// id de sesión anónimo en localStorage (NO cookie, NO PII), sin datos personales.
// El país lo deriva el servidor. Best-effort (fetch keepalive; si falla, ni modo).
// No registra el propio panel de admin (ruido del fundador).

const FLOW_RE = /^\/flow\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

function sessionId(): string {
  try {
    let s = localStorage.getItem("fp-sid");
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("fp-sid", s);
    }
    return s;
  } catch {
    return "";
  }
}

function device(): "mobile" | "desktop" {
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  return coarse || window.innerWidth < 768 ? "mobile" : "desktop";
}

function lang(): "es" | "en" {
  try {
    const l = localStorage.getItem("fp-lang");
    if (l === "es" || l === "en") return l;
  } catch {
    /* noop */
  }
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

function referrerHost(): string {
  try {
    if (!document.referrer) return "";
    const u = new URL(document.referrer);
    if (u.host === location.host) return "";
    return u.host.slice(0, 255);
  } catch {
    return "";
  }
}

export function AnalyticsBeacon() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    const first = last.current === null;
    last.current = pathname;
    if (pathname.startsWith("/admin")) return; // no contamos el panel del fundador

    const m = pathname.match(FLOW_RE);
    const body = JSON.stringify({
      event: "view",
      path: pathname,
      ref: first ? referrerHost() : "",
      device: device(),
      lang: lang(),
      session: sessionId(),
      flowId: m ? m[1] : null,
    });
    try {
      fetch("/api/track", {
        method: "POST",
        body,
        headers: { "content-type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* noop */
    }
  }, [pathname]);

  return null;
}
