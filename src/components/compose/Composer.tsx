"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ImagePlus, Mic, Pause, Play, RefreshCw, Square, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";
import { useRecorder, type Recorder } from "@/lib/useRecorder";
import { COVER_KINDS } from "@/lib/covers";
import { Logo, FlowMark } from "@/components/brand";
import { AudioPlayer, Button, Switch } from "@/components/ui";
import { Cover } from "@/components/cover";
import { ImageCropper } from "@/components/profile/ImageCropper";
import { useSound } from "@/providers/SoundProvider";
import { useI18n } from "@/providers/I18nProvider";
import { publishFlow } from "@/data/publishApi";
import { uploadAudio, uploadCover } from "@/data/storage";
import { hasProfanity } from "@/lib/profanity";
import { StepIndicator } from "./StepIndicator";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { TagPicker } from "./TagPicker";
import { FlowProse } from "./FlowProse";

type Step = "record" | "recording" | "processing" | "edit" | "published";
const MAX = 180; // 3:00 — un Flow es una voz concentrada (configurable en admin)

export function Composer({ availableTags }: { availableTags?: string[] } = {}) {
  const router = useRouter();
  const { play } = useSound();
  const { t } = useI18n();
  const recorder = useRecorder(MAX);

  const [step, setStep] = useState<Step>("record");
  // Fase real del pipeline: la pantalla de proceso cuenta la verdad, no timers.
  const [proc, setProc] = useState<"transcribe" | "polish" | "publish">(
    "transcribe",
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  // Portada con foto propia (opcional): null = portada generativa.
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [pickedCoverFile, setPickedCoverFile] = useState<File | null>(null);
  // Contenido sensible: altisonantes se pre-marca al transcribir; 18+ queda
  // fijo si el Flow lleva el tema Hot.
  const [explicitLang, setExplicitLang] = useState(false);
  const [adult, setAdult] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [newFlowId, setNewFlowId] = useState<string | null>(null);
  const [pubError, setPubError] = useState<string | null>(null);
  const [pipeError, setPipeError] = useState<string | null>(null);
  const [audioWarn, setAudioWarn] = useState<string | null>(null);

  // Hay una voz a medias: grabando, procesando o editando sin publicar aún.
  const dirty =
    step === "recording" || step === "processing" || step === "edit";

  // No perder una grabación de 3 minutos por un reload/cierre accidental.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Los navegadores muestran su propio texto; returnValue activa el aviso.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Mismo cuidado al salir por los links del header (nav interna no dispara
  // beforeunload): se confirma antes de tirar el Flow.
  const confirmLeave = (e: React.MouseEvent) => {
    if (dirty && !window.confirm(t("compose.leave"))) e.preventDefault();
  };

  const startRecording = async () => {
    const ok = await recorder.start();
    if (ok) setStep("recording");
    // Si no, recorder.error se muestra en la pantalla de grabar.
  };

  // Pule el transcript con Gemini (/api/polish). Si el pulido falla o tarda
  // demasiado, somos honestos: el cuerpo queda como el transcript crudo y el
  // usuario lo edita (nunca se pierde la voz por culpa del pulido).
  const runPolish = useCallback(
    async (transcriptText: string) => {
      setProc("polish");
      let result: { title: string; bodyMd: string; tags: string[] } | null = null;
      try {
        const [res] = await Promise.all([
          fetch("/api/polish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: transcriptText }),
            signal: AbortSignal.timeout(75_000),
          }).then((r) => (r.ok ? r.json() : null)),
          new Promise((r) => setTimeout(r, 1600)),
        ]);
        if (res && typeof res.bodyMd === "string" && res.bodyMd) result = res;
      } catch {
        // sin red o timeout: caemos al transcript crudo
      }
      setTitle(result?.title ?? "");
      setBody(result?.bodyMd ?? transcriptText);
      setTags(result?.tags ?? []);
      setCoverIndex(0);
      play("pop");
      setStep("edit");
    },
    [play],
  );

  // Pipeline real: sube el audio a Storage + transcribe con Gemini (en
  // paralelo), luego pule. Sin transcript NO fingimos contenido: se avisa y se
  // vuelve a grabar. Sin subida, se avisa que el Flow saldría sin audio.
  const runPipeline = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      setDuration(Math.max(1, Math.round(durationSeconds)));
      setPipeError(null);
      setAudioWarn(null);
      setProc("transcribe");
      setStep("processing");

      const form = new FormData();
      form.append("audio", blob);

      // La transcripción distingue «saturado» (429 del rate-limit / Gemini)
      // de un fallo normal, y no espera para siempre (timeout de 90s).
      const [url, tr] = await Promise.all([
        uploadAudio(blob).catch(() => null),
        (async (): Promise<{ text: string; busy: boolean }> => {
          try {
            const r = await fetch("/api/transcribe", {
              method: "POST",
              body: form,
              signal: AbortSignal.timeout(90_000),
            });
            if (r.status === 429) return { text: "", busy: true };
            if (!r.ok) return { text: "", busy: false };
            const j = await r.json();
            return {
              text:
                typeof j?.transcript === "string" ? j.transcript.trim() : "",
              busy: false,
            };
          } catch {
            return { text: "", busy: false };
          }
        })(),
      ]);

      if (!tr.text) {
        play("soft");
        setPipeError(
          t(tr.busy ? "compose.err.busy" : "compose.err.transcribe"),
        );
        setStep("record");
        return;
      }

      setAudioUrl(url);
      if (!url) {
        setAudioWarn(t("compose.err.audioUpload"));
      }
      setTranscript(tr.text);
      setExplicitLang(hasProfanity(tr.text));
      await runPolish(tr.text);
    },
    [runPolish, play, t],
  );

  const stopRecording = useCallback(async () => {
    const result = await recorder.stop();
    if (!result) {
      setStep("record");
      play("soft");
      return;
    }
    await runPipeline(result.blob, result.durationSeconds);
  }, [recorder, runPipeline, play]);

  const cancelRecording = useCallback(() => {
    recorder.reset();
    setStep("record");
    play("soft");
  }, [recorder, play]);

  const hotSelected = tags.includes("Hot");
  const effectiveAdult = adult || hotSelected;

  const publish = async () => {
    play("click");
    setPubError(null);
    setProc("publish");
    setStep("processing");
    // Publica de verdad; mantiene ~1.2s de animación mínima.
    const [res] = await Promise.all([
      publishFlow({
        title,
        bodyMd: body,
        transcriptRaw: transcript,
        coverKind: COVER_KINDS[coverIndex],
        coverUrl,
        explicitLang,
        adult: effectiveAdult,
        durationSeconds: duration,
        tagNames: tags,
        audioUrl,
      }),
      new Promise((r) => setTimeout(r, 1200)),
    ]);
    if (res.ok) {
      play("pop");
      setNewFlowId(res.id);
      setStep("published");
    } else {
      play("soft");
      // Sesión vencida ≠ tropiezo del servidor: cada una con su salida.
      setPubError(
        t(
          res.error === "no-session"
            ? "compose.err.session"
            : "compose.err.publish",
        ),
      );
      setStep("edit");
    }
  };

  // «Guardar borrador»: persiste con status=draft y lleva al perfil.
  const saveDraft = async () => {
    play("click");
    setPubError(null);
    const res = await publishFlow({
      title,
      bodyMd: body,
      transcriptRaw: transcript,
      coverKind: COVER_KINDS[coverIndex],
      coverUrl,
      explicitLang,
      adult: effectiveAdult,
      durationSeconds: duration,
      tagNames: tags,
      audioUrl,
      status: "draft",
    });
    if (res.ok) {
      play("pop");
      router.push("/perfil");
    } else {
      play("soft");
      setPubError(
        t(
          res.error === "no-session"
            ? "compose.err.session"
            : "compose.err.draft",
        ),
      );
    }
  };

  const recordAnother = () => {
    recorder.reset();
    setTitle("");
    setBody("");
    setTags([]);
    setCoverIndex(0);
    setCoverUrl(null);
    setExplicitLang(false);
    setAdult(false);
    setDuration(0);
    setTranscript("");
    setAudioUrl(null);
    setNewFlowId(null);
    setPubError(null);
    setStep("record");
  };

  const cycleCover = () => {
    setCoverIndex((i) => (i + 1) % COVER_KINDS.length);
    play("pop");
  };

  // Elegir foto → recortar a 16:9 (WYSIWYG) → subir la versión recortada.
  const pickCoverPhoto = (file: File | null) => {
    if (!file || coverUploading) return;
    play("click");
    setPickedCoverFile(file);
  };

  const onCroppedCover = async (blob: Blob) => {
    setPickedCoverFile(null);
    setCoverUploading(true);
    const url = await uploadCover(
      new File([blob], "cover.jpg", { type: "image/jpeg" }),
    );
    setCoverUploading(false);
    if (url) {
      setCoverUrl(url);
      play("pop");
    } else {
      setPubError(t("compose.err.cover"));
      play("soft");
    }
  };

  const clearCoverPhoto = () => {
    setCoverUrl(null);
    play("soft");
  };

  const stepIndex =
    step === "record" || step === "recording"
      ? 0
      : step === "processing"
        ? proc === "publish"
          ? 3
          : 1
        : step === "edit"
          ? 2
          : 3;

  const wide = step === "edit";

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link href="/" aria-label="FlowPub" onClick={confirmLeave}>
          <Logo markSize={26} textSize={20} />
        </Link>
        <div className="hidden md:block">
          <StepIndicator current={stepIndex} />
        </div>
        <Link
          href="/"
          aria-label="Cerrar"
          onClick={confirmLeave}
          className="fp-hit grid h-9 w-9 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
        >
          <X size={20} />
        </Link>
      </header>

      <main
        className={cn(
          "mx-auto px-4 pb-24 pt-6 lg:pt-10",
          wide ? "max-w-5xl" : "max-w-2xl",
        )}
      >
        {step === "record" && (
          <RecordStep
            onStart={startRecording}
            maxSeconds={MAX}
            error={recorder.error ?? pipeError}
          />
        )}
        {step === "recording" && (
          <RecordingStep
            recorder={recorder}
            maxSeconds={MAX}
            onStop={stopRecording}
            onCancel={cancelRecording}
          />
        )}
        {step === "processing" && <ProcessingStep mode={proc} />}
        {step === "edit" && (
          <EditStep
            title={title}
            setTitle={setTitle}
            body={body}
            setBody={setBody}
            tags={tags}
            setTags={setTags}
            coverIndex={coverIndex}
            cycleCover={cycleCover}
            coverUrl={coverUrl}
            coverUploading={coverUploading}
            onPickCover={pickCoverPhoto}
            onClearCover={clearCoverPhoto}
            explicitLang={explicitLang}
            setExplicitLang={setExplicitLang}
            adult={effectiveAdult}
            setAdult={setAdult}
            hotLocked={hotSelected}
            duration={duration}
            audioUrl={audioUrl}
            audioWarn={audioWarn}
            transcript={transcript}
            availableTags={availableTags}
            error={pubError}
            onPublish={publish}
            onSaveDraft={saveDraft}
          />
        )}
        {step === "published" && (
          <PublishedStep
            title={title}
            coverIndex={coverIndex}
            duration={duration}
            flowId={newFlowId}
            onAnother={recordAnother}
          />
        )}
      </main>

      {pickedCoverFile && (
        <ImageCropper
          file={pickedCoverFile}
          aspect={16 / 9}
          title={t("cover.crop.title")}
          hint={t("cover.crop.hint")}
          confirmLabel={t("cover.crop.confirm")}
          onClose={() => setPickedCoverFile(null)}
          onCropped={(blob) => void onCroppedCover(blob)}
        />
      )}
    </div>
  );
}

// ── record ──────────────────────────────────────────────────────────────────
function RecordStep({
  onStart,
  maxSeconds,
  error,
}: {
  onStart: () => void;
  maxSeconds: number;
  error?: string | null;
}) {
  const { play } = useSound();
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <p className="font-serif text-[40px] leading-tight text-ink">Nuevo Flow</p>
      <p className="mb-10 mt-1 font-sans text-[15px] text-text-2">
        Habla. Nosotros lo volvemos publicación.
      </p>
      <button
        type="button"
        aria-label="Grabar"
        onClick={() => {
          play("rec");
          onStart();
        }}
        className="grid h-[120px] w-[120px] place-items-center rounded-pill border border-line-2 bg-surface shadow-[0_10px_30px_-12px_rgba(26,23,20,.3)] transition-transform duration-150 ease-flow active:scale-[.95]"
      >
        <Mic size={40} className="text-grana" />
      </button>
      <p className="mt-4 font-mono text-[13px] text-text-2">
        {formatDuration(maxSeconds)}
      </p>
      <p className="mt-6 max-w-xs font-sans text-[14px] leading-relaxed text-text-2">
        Toca para grabar. Tienes hasta {Math.round(maxSeconds / 60)} minutos; di
        lo que quieras, con tus pausas.
      </p>
      {error && (
        <p role="status" className="mt-5 max-w-xs font-sans text-[14px] text-grana">
          {error}
        </p>
      )}
    </div>
  );
}

// ── recording ───────────────────────────────────────────────────────────────
const BARS = [
  "bg-grana",
  "bg-ocre",
  "bg-grana",
  "bg-ink",
  "bg-grana",
  "bg-ocre",
  "bg-grana",
  "bg-grana",
  "bg-ink",
  "bg-ocre",
  "bg-grana",
];

function Waveform({ paused }: { paused?: boolean }) {
  return (
    <div className="mt-5 flex h-12 items-center justify-center gap-1.5" aria-hidden>
      {BARS.map((c, i) => (
        <span
          key={i}
          className={cn("w-1 rounded-pill", c, paused && "opacity-40")}
          style={{
            height: 40,
            transformOrigin: "center",
            animation: `fp-bar 1.1s ease-in-out ${i * 0.09}s infinite`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      ))}
    </div>
  );
}

function RecordingStep({
  recorder,
  maxSeconds,
  onStop,
  onCancel,
}: {
  recorder: Recorder;
  maxSeconds: number;
  onStop: () => void;
  onCancel: () => void;
}) {
  const { play } = useSound();
  useEffect(() => {
    if (recorder.elapsed >= maxSeconds) onStop();
  }, [recorder.elapsed, maxSeconds, onStop]);

  const warn = recorder.elapsed >= maxSeconds - 60;
  const paused = recorder.paused;

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-pill",
            paused ? "bg-text-3" : "animate-pulse bg-grana",
          )}
        />
        <span
          className={cn(
            "font-sans text-[12px] font-semibold uppercase tracking-[0.14em]",
            paused ? "text-text-3" : "text-grana",
          )}
        >
          {paused ? "En pausa" : "REC"}
        </span>
      </div>
      <div
        className={cn(
          "mt-2 font-mono text-[16px] tabular-nums",
          warn ? "text-grana" : "text-text-2",
        )}
      >
        {formatDuration(recorder.elapsed)} / {formatDuration(maxSeconds)}
      </div>

      <Waveform paused={paused} />

      <p className="mb-1 mt-7 font-serif text-[18px] text-text-2">
        {paused ? "En pausa" : "Te escuchamos…"}
      </p>
      <p className="max-w-xs font-sans text-[13px] leading-relaxed text-text-2">
        {paused
          ? "Cuando quieras, seguimos grabando desde donde te quedaste."
          : "Al terminar, Gemini transcribe y pule tu voz en un Flow."}
      </p>

      {/* Pausar/reanudar + detener, juntos pero claros. */}
      <div className="mt-8 flex items-center gap-6">
        <button
          type="button"
          aria-label={paused ? "Reanudar" : "Pausar"}
          onClick={() => {
            if (paused) {
              recorder.resume();
              play("soft");
            } else {
              recorder.pause();
              play("tick");
            }
          }}
          className="grid h-[62px] w-[62px] place-items-center rounded-pill border border-line-2 bg-surface text-ink transition-colors duration-150 ease-flow hover:bg-[var(--hover)] active:scale-[.94]"
        >
          {paused ? <Play size={22} fill="currentColor" /> : <Pause size={22} fill="currentColor" />}
        </button>
        <button
          type="button"
          aria-label="Detener"
          onClick={onStop}
          className="grid h-[78px] w-[78px] place-items-center rounded-pill bg-grana text-white shadow-[0_10px_26px_-8px_rgba(192,48,58,.8)] transition-transform duration-150 ease-flow active:scale-[.94]"
        >
          <Square size={24} fill="currentColor" />
        </button>
      </div>
      <p className="mt-3 font-mono text-[11px] text-text-3">
        {paused ? "Reanudar · Detener" : "Pausar · Detener"}
      </p>

      <button
        type="button"
        onClick={onCancel}
        className="mt-9 font-sans text-[13px] text-text-3 underline underline-offset-2 transition-colors hover:text-ink"
      >
        Cancelar
      </button>
    </div>
  );
}

// ── processing ───────────────────────────────────────────────────────────────
// Cuenta la VERDAD: la fase la fija el pipeline real (transcribe → polish →
// publish), no timers de utilería. Si Gemini tarda, se avisa que seguimos.
const PHASE_KEYS = {
  transcribe: ["compose.phase.transcribe.t", "compose.phase.transcribe.s"],
  polish: ["compose.phase.polish.t", "compose.phase.polish.s"],
  publish: ["compose.phase.publish.t", "compose.phase.publish.s"],
} as const;

function ProcessingStep({
  mode,
}: {
  mode: "transcribe" | "polish" | "publish";
}) {
  const { t } = useI18n();
  const [slow, setSlow] = useState(false);

  // Pasados ~12s en la misma fase, un guiño honesto de «seguimos en ello».
  useEffect(() => {
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 12_000);
    return () => window.clearTimeout(timer);
  }, [mode]);

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <FlowMark size={64} draw className="text-grana" />
      <p className="mt-8 font-serif text-[24px] text-ink">
        {t(PHASE_KEYS[mode][0])}
      </p>
      <p className="mt-1 font-sans text-[14px] text-text-2">
        {t(PHASE_KEYS[mode][1])}
      </p>
      <p
        role="status"
        className={cn(
          "mt-5 font-sans text-[13px] text-text-2 transition-opacity duration-300",
          slow ? "opacity-100" : "opacity-0",
        )}
      >
        {slow ? t("compose.slow") : ""}
      </p>
    </div>
  );
}

// ── edit ─────────────────────────────────────────────────────────────────────
function ViewToggle({
  view,
  onChange,
}: {
  view: "edit" | "preview";
  onChange: (v: "edit" | "preview") => void;
}) {
  const { play } = useSound();
  const items: ["edit" | "preview", string][] = [
    ["edit", "Editar"],
    ["preview", "Previa"],
  ];
  return (
    <div className="inline-flex items-center rounded-pill bg-surface-2 p-[3px]">
      {items.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          onClick={() => {
            onChange(v);
            play("tick");
          }}
          className={cn(
            "fp-hit-y rounded-pill px-3 py-1 font-sans text-[12px] font-semibold transition-colors duration-150",
            view === v
              ? "bg-surface text-ink shadow-[var(--shadow-thumb)]"
              : "text-text-2 hover:text-ink",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

interface EditStepProps {
  title: string;
  setTitle: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  tags: string[];
  setTags: (v: string[]) => void;
  coverIndex: number;
  cycleCover: () => void;
  coverUrl: string | null;
  coverUploading: boolean;
  onPickCover: (file: File | null) => void;
  onClearCover: () => void;
  explicitLang: boolean;
  setExplicitLang: (v: boolean) => void;
  adult: boolean;
  setAdult: (v: boolean) => void;
  /** El tema Hot fija 18+ (no se puede desmarcar). */
  hotLocked: boolean;
  duration: number;
  audioUrl: string | null;
  audioWarn?: string | null;
  transcript: string;
  /** Temas reales de la BD (name_es); si falta, TagPicker cae a la estática. */
  availableTags?: string[];
  error?: string | null;
  onPublish: () => void;
  onSaveDraft: () => void;
}

function EditStep({
  title,
  setTitle,
  body,
  setBody,
  tags,
  setTags,
  coverIndex,
  cycleCover,
  coverUrl,
  coverUploading,
  onPickCover,
  onClearCover,
  explicitLang,
  setExplicitLang,
  adult,
  setAdult,
  hotLocked,
  duration,
  audioUrl,
  audioWarn,
  transcript,
  availableTags,
  error,
  onPublish,
  onSaveDraft,
}: EditStepProps) {
  const { t } = useI18n();
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [showT, setShowT] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* izquierda: portada + audio + transcript */}
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-2">
            {coverUrl ? t("compose.coverPhoto") : t("compose.coverGenerated")}
          </p>
          <div className="overflow-hidden rounded-[14px] border border-line">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt="Foto de portada"
                className="block aspect-[16/9] w-full object-cover"
              />
            ) : (
              <Cover kind={COVER_KINDS[coverIndex]} seed={`compose-${coverIndex}`} />
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {!coverUrl && (
              <button
                type="button"
                onClick={cycleCover}
                className="inline-flex items-center gap-2 rounded-pill border border-line-2 px-3.5 py-1.5 font-sans text-[13px] font-medium text-ink transition-colors hover:bg-[var(--hover)]"
              >
                <RefreshCw size={14} />
                Regenerar portada
              </button>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-line-2 px-3.5 py-1.5 font-sans text-[13px] font-medium text-ink transition-colors hover:bg-[var(--hover)]">
              <ImagePlus size={14} />
              {coverUploading
                ? "Subiendo…"
                : coverUrl
                  ? "Cambiar foto"
                  : "Subir mi foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={coverUploading}
                onChange={(e) => {
                  onPickCover(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </label>
            {coverUrl && (
              <button
                type="button"
                onClick={onClearCover}
                className="inline-flex items-center gap-2 rounded-pill px-3 py-1.5 font-sans text-[13px] font-medium text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
              >
                <RefreshCw size={14} />
                Usar la generada
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-2">
            {t("compose.audio")}
          </p>
          <AudioPlayer
            src={audioUrl ?? undefined}
            durationSeconds={duration}
            variant="full"
          />
          {audioWarn && (
            <p role="status" className="mt-2 font-sans text-[13px] text-grana">
              {audioWarn}
            </p>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowT((v) => !v)}
            aria-expanded={showT}
            className="flex items-center gap-1.5 font-sans text-[13px] font-medium text-text-2 transition-colors hover:text-ink"
          >
            <ChevronDown
              size={15}
              className={cn("transition-transform duration-150", showT && "rotate-180")}
            />
            {t("compose.viewTranscript")}
          </button>
          {showT && (
            <div className="mt-2 whitespace-pre-wrap rounded-[12px] border border-line bg-surface-2 p-4 font-serif text-[14.5px] leading-[1.6] text-text-2">
              {transcript}
            </div>
          )}
        </div>
      </div>

      {/* derecha: editor */}
      <div className="flex flex-col">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de tu Flow"
          aria-label="Título de tu Flow"
          className="w-full border-0 border-b border-line bg-transparent pb-2 font-serif text-[28px] font-medium text-ink outline-none placeholder:text-text-3 focus:border-grana"
        />

        <div className="mb-2 mt-4 flex items-center justify-between gap-2">
          <MarkdownToolbar textareaRef={taRef} value={body} onChange={setBody} />
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === "edit" ? (
          <textarea
            ref={taRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck
            aria-label="Cuerpo del Flow"
            className="min-h-[260px] w-full resize-y rounded-[12px] border border-line bg-surface p-4 font-serif text-[17px] leading-[1.7] text-ink outline-none focus:border-grana"
          />
        ) : (
          <div className="min-h-[260px] rounded-[12px] border border-line bg-surface p-5">
            <FlowProse source={body} />
          </div>
        )}

        <div className="mt-6">
          <TagPicker
            selected={tags}
            onChange={setTags}
            options={availableTags}
            allowCreate
          />
        </div>

        {/* contenido sensible: el autor declara; Hot fija 18+ */}
        <div className="mt-6 flex flex-col gap-1 rounded-[14px] border border-line bg-surface p-4">
          <p className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-2">
            Contenido sensible
          </p>
          <div className="flex items-center justify-between gap-4 py-1.5">
            <div>
              <p className="font-sans text-[14px] font-semibold text-ink">
                Palabras altisonantes
              </p>
              <p className="font-sans text-[12.5px] text-text-2">
                {explicitLang
                  ? "Se detectaron en tu transcript — puedes corregir la marca."
                  : "Márcalo si tu Flow trae groserías."}
              </p>
            </div>
            <Switch
              checked={explicitLang}
              onCheckedChange={setExplicitLang}
              label="Palabras altisonantes"
            />
          </div>
          <div className="flex items-center justify-between gap-4 py-1.5">
            <div>
              <p className="font-sans text-[14px] font-semibold text-ink">
                Para mayores de 18
              </p>
              <p className="font-sans text-[12.5px] text-text-2">
                {hotLocked
                  ? "El tema Hot siempre es para mayores de 18."
                  : "Solo quien confirme su edad podrá escucharlo."}
              </p>
            </div>
            <Switch
              checked={adult}
              onCheckedChange={setAdult}
              disabled={hotLocked}
              label="Para mayores de 18"
            />
          </div>
        </div>

        {error && (
          <p role="status" className="mt-4 text-right font-sans text-[13px] text-grana">
            {error}
          </p>
        )}
        <div className="mt-7 flex items-center justify-end gap-3 border-t border-line pt-5">
          <Button variant="secondary" sound="soft" onClick={onSaveDraft}>
            Guardar borrador
          </Button>
          <Button sound={null} onClick={onPublish}>
            Publicar Flow
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── published ────────────────────────────────────────────────────────────────
function PublishedStep({
  title,
  coverIndex,
  duration,
  flowId,
  onAnother,
}: {
  title: string;
  coverIndex: number;
  duration: number;
  flowId: string | null;
  onAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <FlowMark size={56} breathe className="text-grana" />
      <h2 className="mt-6 font-serif text-[30px] text-ink">
        Tu Flow está en el Pub
      </h2>
      <p className="mt-2 max-w-sm font-sans text-[15px] text-text-2">
        Ya puede escucharse y leerse. La gente podrá comentarlo con voz o texto.
      </p>

      <div className="mt-8 w-full max-w-sm overflow-hidden rounded-card border border-line bg-surface text-left shadow-[var(--shadow-card)]">
        <Cover kind={COVER_KINDS[coverIndex]} seed={`compose-${coverIndex}`} />
        <div className="p-5">
          <h3 className="font-serif text-[20px] font-medium text-ink">
            {title || "Tu Flow"}
          </h3>
          <p className="mt-1 font-mono text-[12px] text-text-2">
            {formatDuration(duration)} de audio
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={flowId ? `/flow/${flowId}` : "/"}
          className="inline-flex h-11 items-center rounded-pill bg-grana px-5 font-sans text-[15px] font-semibold text-white transition-colors hover:bg-grana-700"
        >
          Ver mi Flow
        </Link>
        <Button variant="secondary" onClick={onAnother}>
          Grabar otro
        </Button>
      </div>
    </div>
  );
}
