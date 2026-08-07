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
import { dictionaries, type DictKey, type Lang } from "@/lib/i18n/dictionaries";

type LangPref = "auto" | Lang;
const KEY = "fp-lang";

interface I18nCtx {
  pref: LangPref;
  lang: Lang;
  setLang: (p: LangPref) => void;
  t: (k: DictKey, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

// Detecta el idioma mirando TODAS las preferencias del usuario, no solo la
// primera. `navigator.language` es el idioma de la INTERFAZ del navegador: un
// Chrome instalado en inglés reporta «en-US» aunque la persona tenga español
// entre sus idiomas preferidos. Eso mandaba la app a inglés con la preferencia
// en «Auto» — le pasó a Julio en su Android. `navigator.languages` sí trae la
// lista completa, así que basta con que el español aparezca en ella.
function detect(): Lang {
  if (typeof navigator === "undefined") return "es";
  const prefs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return prefs.some((l) => l?.toLowerCase().startsWith("es")) ? "es" : "en";
}

function interpolate(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<LangPref>("auto");
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    let p: LangPref = "auto";
    try {
      const s = localStorage.getItem(KEY);
      if (s === "es" || s === "en") p = s;
    } catch {
      /* noop */
    }
    const resolved = p === "auto" ? detect() : p;
    setPrefState(p);
    setLangState(resolved);
    document.documentElement.lang = resolved;
  }, []);

  const setLang = useCallback((p: LangPref) => {
    const resolved = p === "auto" ? detect() : p;
    setPrefState(p);
    setLangState(resolved);
    document.documentElement.lang = resolved;
    try {
      if (p === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, p);
    } catch {
      /* noop */
    }
  }, []);

  const t = useCallback(
    (k: DictKey, vars?: Record<string, string | number>) =>
      interpolate(dictionaries[lang][k] ?? dictionaries.es[k] ?? k, vars),
    [lang],
  );

  const value = useMemo(
    () => ({ pref, lang, setLang, t }),
    [pref, lang, setLang, t],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Override LOCAL del idioma para una página que se documenta a sí misma en los
 * dos idiomas (el manual de marca, el deck). Sombrea el contexto para su
 * subárbol: adentro, `useI18n()` devuelve el idioma local y su `setLang` solo
 * cambia esa página.
 *
 * Por qué existe: esas páginas traen su propio switch ES/EN, y como llamaban al
 * `setLang` GLOBAL, un clic en «EN» dejaba la app ENTERA en inglés — persistido
 * en localStorage, sin nada que lo indicara. Una página de documentación no
 * debe repuntar el idioma del producto. Arranca siguiendo el idioma global.
 */
export function LangOverride({ children }: { children: ReactNode }) {
  const parent = useI18n();
  const [local, setLocal] = useState<Lang | null>(null);
  const lang = local ?? parent.lang;

  const setLang = useCallback((p: LangPref) => {
    setLocal(p === "auto" ? null : p);
  }, []);

  const t = useCallback(
    (k: DictKey, vars?: Record<string, string | number>) =>
      interpolate(dictionaries[lang][k] ?? dictionaries.es[k] ?? k, vars),
    [lang],
  );

  const value = useMemo(
    () => ({ pref: local ?? parent.pref, lang, setLang, t }),
    [local, parent.pref, lang, setLang, t],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n debe usarse dentro de <I18nProvider>");
  return c;
}
