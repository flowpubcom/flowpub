"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createSoundEngine, type BlipType, type SoundEngine } from "@/lib/sound";

const KEY = "fp-muted";

interface SoundCtx {
  muted: boolean;
  setMuted: (m: boolean) => void;
  toggleMuted: () => void;
  /** Reproduce un blip (no-op si está silenciado). Llamar desde un gesto. */
  play: (t: BlipType, volume?: number) => void;
}

const Ctx = createContext<SoundCtx | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<SoundEngine | null>(null);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    engineRef.current = createSoundEngine();
    try {
      setMutedState(localStorage.getItem(KEY) === "1");
    } catch {
      /* noop */
    }
  }, []);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    try {
      localStorage.setItem(KEY, m ? "1" : "0");
    } catch {
      /* noop */
    }
  }, []);

  const toggleMuted = useCallback(
    () => setMuted(!muted),
    [muted, setMuted],
  );

  const play = useCallback(
    (t: BlipType, volume?: number) => {
      if (muted) return;
      engineRef.current?.blip(t, volume);
    },
    [muted],
  );

  const value = useMemo(
    () => ({ muted, setMuted, toggleMuted, play }),
    [muted, setMuted, toggleMuted, play],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSound() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSound debe usarse dentro de <SoundProvider>");
  return c;
}
