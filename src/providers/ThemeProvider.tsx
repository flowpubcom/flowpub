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

// Colores de la barra del navegador móvil — los mismos que viewport.themeColor
// en el layout (que solo sigue el @media del SO y queda como default del
// primer paint); aquí los sincronizamos con el tema resuelto, override incluido.
const THEME_COLOR: Record<Resolved, string> = {
  light: "#f4f1ea",
  dark: "#141110",
};

function apply(theme: Resolved) {
  // Siempre explícito: "light" debe sobreponerse a un SO oscuro (y viceversa).
  document.documentElement.setAttribute("data-theme", theme);
  // <meta name="theme-color">: el navegador toma la PRIMERA que matchee, así
  // que actualizamos todas las existentes (las dos con media que emite
  // viewport.themeColor) para que coincidan, o creamos una si no hay ninguna.
  const metas = document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = THEME_COLOR[theme];
    document.head.appendChild(meta);
  } else {
    metas.forEach((m) => {
      m.content = THEME_COLOR[theme];
    });
  }
}

// Primer render ya con el tema real: el script anti-FOUC del <head> deja el
// data-theme puesto cuando hay override explícito; si no, resolvemos el SO.
// Así los consumidores JS (ThreeStage del splash, visuales del deck) no pintan
// la variante clara un instante. Ojo: en SSR esto siempre es "light"; para
// quien resuelve oscuro hay un mismatch de hidratación asumido — React lo
// recupera re-renderizando en cliente y el DOM queda correcto.
function initialTheme(): Resolved {
  if (typeof document === "undefined") return "light";
  const t = document.documentElement.getAttribute("data-theme");
  if (t === "light" || t === "dark") return t;
  return systemTheme();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>("system");
  const [theme, setTheme] = useState<Resolved>(initialTheme);

  // initialTheme ya dejó el estado correcto desde el primer render; aquí
  // sincronizamos la preferencia guardada y garantizamos data-theme +
  // theme-color en el DOM (en «system» el script anti-FOUC no toca nada).
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
