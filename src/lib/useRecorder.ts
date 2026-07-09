import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";

// Grabador REAL (MediaRecorder). La transcripción es post-grabación (Gemini STT
// en /api/transcribe); no hay transcript en vivo por ahora. Respeta permisos.
// Soporta pausar/reanudar: el cronómetro acumula tiempo por segmentos, así el
// elapsed refleja SOLO lo grabado (las pausas no cuentan).

export interface RecordingResult {
  blob: Blob;
  durationSeconds: number;
}

export interface Recorder {
  recording: boolean;
  paused: boolean;
  elapsed: number;
  error: string | null;
  start: () => Promise<boolean>;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<RecordingResult | null>;
  reset: () => void;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const cands = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const c of cands) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

export function useRecorder(maxSeconds = 540): Recorder {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // `t` se re-crea al cambiar de idioma; lo leemos por ref para no re-armar los
  // callbacks (start/stop) en cada render ni ensuciar sus dependencias.
  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;

  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const mimeRef = useRef<string>("");

  // Cronómetro por segmentos: accMs = tiempo grabado ya cerrado; segStart =
  // performance.now() del segmento en curso (mientras NO está en pausa).
  const accMsRef = useRef(0);
  const segStartRef = useRef(0);

  // stop() puede llamarse dos veces casi a la vez (el tope de 3 min y el click
  // del usuario): guardamos la promesa en vuelo para que la 2ª devuelva la
  // misma en vez de reasignar onstop y colgar la 1ª (se perdía la grabación).
  const stopPromiseRef = useRef<Promise<RecordingResult | null> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const currentMs = useCallback(() => {
    const seg =
      mediaRef.current?.state === "recording"
        ? performance.now() - segStartRef.current
        : 0;
    return accMsRef.current + seg;
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setInterval(() => {
      setElapsed(Math.min(maxSeconds, currentMs() / 1000));
    }, 200);
  }, [clearTimer, maxSeconds, currentMs]);

  const cleanup = useCallback(() => {
    clearTimer();
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    mediaRef.current = null;
  }, [clearTimer]);

  const start = useCallback(async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError(tRef.current("rec.noSupport"));
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      mimeRef.current = mime || "audio/webm";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRef.current = mr;
      mr.start();
      accMsRef.current = 0;
      segStartRef.current = performance.now();
      setRecording(true);
      setPaused(false);
      setElapsed(0);
      startTimer();
      return true;
    } catch {
      setError(tRef.current("rec.micError"));
      cleanup();
      return false;
    }
  }, [startTimer, cleanup]);

  const pause = useCallback(() => {
    const mr = mediaRef.current;
    if (!mr || mr.state !== "recording") return;
    accMsRef.current += performance.now() - segStartRef.current;
    clearTimer();
    try {
      mr.pause();
    } catch {
      /* si el navegador no soporta pausar, no rompemos */
    }
    setPaused(true);
    setElapsed(Math.min(maxSeconds, accMsRef.current / 1000));
  }, [clearTimer, maxSeconds]);

  const resume = useCallback(() => {
    const mr = mediaRef.current;
    if (!mr || mr.state !== "paused") return;
    segStartRef.current = performance.now();
    try {
      mr.resume();
    } catch {
      /* noop */
    }
    setPaused(false);
    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    // Reentrante: si ya hay un stop en vuelo, devuelve esa misma promesa.
    if (stopPromiseRef.current) return stopPromiseRef.current;

    const mr = mediaRef.current;
    clearTimer();
    const durationSeconds = Math.min(maxSeconds, currentMs() / 1000);
    setRecording(false);
    setPaused(false);

    // Sin recorder o ya detenido: no hay onstop que esperar; resuelve con lo
    // que haya (los chunks ya juntados), o null si nunca hubo grabación.
    if (!mr || mr.state === "inactive") {
      if (!mr && chunksRef.current.length === 0) {
        cleanup();
        return Promise.resolve(null);
      }
      const blob = new Blob(chunksRef.current, {
        type: mimeRef.current || "audio/webm",
      });
      cleanup();
      return Promise.resolve({ blob, durationSeconds });
    }

    const p = new Promise<RecordingResult | null>((resolve) => {
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeRef.current || "audio/webm",
        });
        cleanup();
        stopPromiseRef.current = null;
        resolve({ blob, durationSeconds });
      };
      try {
        mr.stop(); // stop() funciona igual desde estado "paused"
      } catch {
        cleanup();
        stopPromiseRef.current = null;
        resolve(null);
      }
    });
    stopPromiseRef.current = p;
    return p;
  }, [maxSeconds, clearTimer, currentMs, cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setRecording(false);
    setPaused(false);
    setElapsed(0);
    setError(null);
    chunksRef.current = [];
    accMsRef.current = 0;
    segStartRef.current = 0;
    stopPromiseRef.current = null;
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return { recording, paused, elapsed, error, start, pause, resume, stop, reset };
}
