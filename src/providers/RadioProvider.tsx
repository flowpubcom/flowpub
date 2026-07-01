"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Radio del Pub: al terminar un audio, suena el siguiente Flow con audio.
// Solo una voz a la vez. Provider de alcance local (lo monta PubFeed, no el
// árbol raíz); fuera de él, useRadio() regresa null y los players son solistas.

interface RadioCtxValue {
  /** Flow cuya voz está «en el aire» (o a punto de estarlo). */
  activeId: string | null;
  /** Se incrementa en cada auto-avance: señal de autoplay para el siguiente. */
  epoch: number;
  /** El usuario puso play en este Flow (pausa a los demás). */
  claim: (id: string) => void;
  /** El audio de este Flow terminó → avanza la radio. */
  ended: (id: string) => void;
  /** Registra la tarjeta para el scroll suave al avanzar. */
  registerCard: (id: string, el: HTMLElement | null) => void;
}

const Ctx = createContext<RadioCtxValue | null>(null);

export function RadioProvider({
  order,
  children,
}: {
  /** Ids de Flows CON audio, en el orden visible del feed. */
  order: string[];
  children: ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [epoch, setEpoch] = useState(0);
  const orderRef = useRef(order);
  orderRef.current = order;
  const cards = useRef(new Map<string, HTMLElement>());

  const claim = useCallback((id: string) => setActiveId(id), []);

  const ended = useCallback((id: string) => {
    const o = orderRef.current;
    const i = o.indexOf(id);
    const next = i >= 0 && i < o.length - 1 ? o[i + 1] : null;
    setActiveId(next);
    if (!next) return;
    setEpoch((e) => e + 1);
    const el = cards.current.get(next);
    if (el) {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      el.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center",
      });
    }
  }, []);

  const registerCard = useCallback((id: string, el: HTMLElement | null) => {
    if (el) cards.current.set(id, el);
    else cards.current.delete(id);
  }, []);

  const value = useMemo(
    () => ({ activeId, epoch, claim, ended, registerCard }),
    [activeId, epoch, claim, ended, registerCard],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRadio() {
  return useContext(Ctx);
}
