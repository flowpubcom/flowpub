import { useCallback, useEffect, useRef, useState } from "react";

// Grabador REAL (MediaRecorder). La transcripción es post-grabación (Gemini STT
// en /api/transcribe); no hay transcript en vivo por ahora. Respeta permisos.

export interface RecordingResult {
  blob: Blob;
  durationSeconds: number;
}

export interface Recorder {
  recording: boolean;
  elapsed: number;
  error: string | null;
  start: () => Promise<boolean>;
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
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTs = useRef(0);
  const mimeRef = useRef<string>("");

  const clearTimer = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    clearTimer();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRef.current = null;
  }, [clearTimer]);

  const start = useCallback(async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Tu navegador no permite grabar audio.");
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
      setRecording(true);
      setElapsed(0);
      startTs.current = performance.now();
      timerRef.current = window.setInterval(() => {
        const e = (performance.now() - startTs.current) / 1000;
        setElapsed(Math.min(maxSeconds, e));
      }, 200);
      return true;
    } catch {
      setError("No pudimos usar el micrófono. Revisa los permisos del navegador.");
      cleanup();
      return false;
    }
  }, [maxSeconds, cleanup]);

  const stop = useCallback(() => {
    const mr = mediaRef.current;
    clearTimer();
    setRecording(false);
    const durationSeconds = Math.min(
      maxSeconds,
      (performance.now() - startTs.current) / 1000,
    );
    if (!mr) return Promise.resolve(null);
    return new Promise<RecordingResult | null>((resolve) => {
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeRef.current || "audio/webm",
        });
        cleanup();
        resolve({ blob, durationSeconds });
      };
      try {
        mr.stop();
      } catch {
        cleanup();
        resolve(null);
      }
    });
  }, [maxSeconds, clearTimer, cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setRecording(false);
    setElapsed(0);
    setError(null);
    chunksRef.current = [];
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return { recording, elapsed, error, start, stop, reset };
}
