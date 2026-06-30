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

function detect(): Lang {
  if (typeof navigator === "undefined") return "es";
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
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

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n debe usarse dentro de <I18nProvider>");
  return c;
}
