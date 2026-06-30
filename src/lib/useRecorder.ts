import { useCallback, useEffect, useRef, useState } from "react";
import { WORDS } from "@/data/composeMock";

// Grabador SIMULADO (front-first): timer + streaming de transcript palabra por
// palabra. Cuando entre Gemini, se reemplaza por MediaRecorder + STT en vivo
// manteniendo esta misma interfaz.

export interface Recorder {
  recording: boolean;
  elapsed: number;
  transcript: string[];
  start: () => void;
  stop: () => number;
  reset: () => void;
}

export function useRecorder(maxSeconds = 540): Recorder {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);

  const timerRef = useRef<number | null>(null);
  const wordRef = useRef<number | null>(null);
  const wi = useRef(0);
  const startTs = useRef(0);

  const clearTimers = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (wordRef.current) window.clearInterval(wordRef.current);
    timerRef.current = null;
    wordRef.current = null;
  }, []);

  const start = useCallback(() => {
    clearTimers();
    setRecording(true);
    setTranscript([]);
    setElapsed(0);
    wi.current = 0;
    startTs.current = performance.now();

    timerRef.current = window.setInterval(() => {
      const e = (performance.now() - startTs.current) / 1000;
      setElapsed(Math.min(maxSeconds, e));
    }, 200);

    wordRef.current = window.setInterval(() => {
      if (wi.current >= WORDS.length) return;
      setTranscript((t) => [...t, WORDS[wi.current]]);
      wi.current += 1;
    }, 360);
  }, [clearTimers, maxSeconds]);

  const stop = useCallback(() => {
    clearTimers();
    setRecording(false);
    const final = Math.min(maxSeconds, (performance.now() - startTs.current) / 1000);
    setElapsed(final);
    return final;
  }, [clearTimers, maxSeconds]);

  const reset = useCallback(() => {
    clearTimers();
    setRecording(false);
    setElapsed(0);
    setTranscript([]);
    wi.current = 0;
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  return { recording, elapsed, transcript, start, stop, reset };
}
