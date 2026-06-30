"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ThemePref = "light" | "dark" | "system";
type Resolved = "light" | "dark";

const KEY = "fp-theme";

interface ThemeCtx {
  /** Preferencia del usuario (incluye «system»). */
  pref: ThemePref;
  /** Tema resuelto que está pintado ahora. */
  theme: Resolved;
  setPref: (p: ThemePref) => void;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

function systemTheme(): Resolved {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function apply(theme: Resolved) {
  const el = document.documentElement;
  if (theme === "dark") el.setAttribute("data-theme", "dark");
  else el.removeAttribute("data-theme");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>("system");
  const [theme, setTheme] = useState<Resolved>("light");

  // El script anti-FOUC del <head> ya pintó el data-theme antes del primer
  // frame; aquí solo sincronizamos el estado de React con lo guardado.
  useEffect(() => {
    let stored: ThemePref = "system";
    try {
      const s = localStorage.getItem(KEY);
      if (s === "light" || s === "dark") stored = s;
    } catch {
      /* localStorage no disponible */
    }
    const resolved = stored === "system" ? systemTheme() : stored;
    setPrefState(stored);
    setTheme(resolved);
    apply(resolved); // garantiza que el DOM concuerde aun si el script anti-FOUC no corrió
  }, []);

  // Seguir al SO mientras la preferencia sea «system».
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const t: Resolved = mq.matches ? "dark" : "light";
      setTheme(t);
      apply(t);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    const t = p === "system" ? systemTheme() : p;
    setTheme(t);
    apply(t);
    try {
      if (p === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, p);
    } catch {
      /* noop */
    }
  }, []);

  const toggle = useCallback(() => {
    setPref(theme === "dark" ? "light" : "dark");
  }, [theme, setPref]);

  const value = useMemo(
    () => ({ pref, theme, setPref, toggle }),
    [pref, theme, setPref, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return c;
}
