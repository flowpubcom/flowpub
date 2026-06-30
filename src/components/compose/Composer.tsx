"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Mic, RefreshCw, Square, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";
import { useRecorder, type Recorder } from "@/lib/useRecorder";
import { COVER_KINDS } from "@/lib/covers";
import { Logo, FlowMark } from "@/components/brand";
import { AudioPlayer, Button } from "@/components/ui";
import { Cover } from "@/components/cover";
import { useSound } from "@/providers/SoundProvider";
import {
  POLISHED_MD,
  RAW_TRANSCRIPT,
  SUGGESTED_TAGS,
  SUGGESTED_TITLE,
} from "@/data/composeMock";
import { StepIndicator } from "./StepIndicator";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { TagPicker } from "./TagPicker";
import { FlowProse } from "./FlowProse";

type Step = "record" | "recording" | "processing" | "edit" | "published";
const MAX = 540; // 9:00 (configurable en admin más adelante)

export function Composer() {
  const router = useRouter();
  const { play } = useSound();
  const recorder = useRecorder(MAX);

  const [step, setStep] = useState<Step>("record");
  const [proc, setProc] = useState<"polish" | "publish">("polish");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [duration, setDuration] = useState(0);

  const startRecording = () => {
    recorder.start();
    setStep("recording");
  };

  const stopRecording = useCallback(() => {
    const dur = recorder.stop();
    setDuration(Math.max(8, Math.round(dur)));
    setProc("polish");
    setStep("processing");
  }, [recorder]);

  const cancelRecording = useCallback(() => {
    recorder.reset();
    setStep("record");
    play("soft");
  }, [recorder, play]);

  const onPolished = useCallback(() => {
    setTitle(SUGGESTED_TITLE);
    setBody(POLISHED_MD);
    setTags(SUGGESTED_TAGS);
    setCoverIndex(0);
    play("pop");
    setStep("edit");
  }, [play]);

  const publish = () => {
    play("click");
    setProc("publish");
    setStep("processing");
  };

  const onPublishedDone = useCallback(() => {
    play("pop");
    setStep("published");
  }, [play]);

  const recordAnother = () => {
    recorder.reset();
    setTitle("");
    setBody("");
    setTags([]);
    setCoverIndex(0);
    setDuration(0);
    setStep("record");
  };

  const cycleCover = () => {
    setCoverIndex((i) => (i + 1) % COVER_KINDS.length);
    play("pop");
  };

  const stepIndex =
    step === "record" || step === "recording"
      ? 0
      : step === "processing"
        ? proc === "polish"
          ? 1
          : 3
        : step === "edit"
          ? 2
          : 3;

  const wide = step === "edit";

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link href="/" aria-label="FlowPub">
          <Logo markSize={26} textSize={20} />
        </Link>
        <div className="hidden md:block">
          <StepIndicator current={stepIndex} />
        </div>
        <Link
          href="/"
          aria-label="Cerrar"
          className="grid h-9 w-9 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
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
          <RecordStep onStart={startRecording} maxSeconds={MAX} />
        )}
        {step === "recording" && (
          <RecordingStep
            recorder={recorder}
            maxSeconds={MAX}
            onStop={stopRecording}
            onCancel={cancelRecording}
          />
        )}
        {step === "processing" && (
          <ProcessingStep
            mode={proc}
            onDone={proc === "polish" ? onPolished : onPublishedDone}
          />
        )}
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
            duration={duration}
            onPublish={publish}
            onSaveDraft={() => router.push("/")}
          />
        )}
        {step === "published" && (
          <PublishedStep
            title={title}
            coverIndex={coverIndex}
            duration={duration}
            onAnother={recordAnother}
          />
        )}
      </main>
    </div>
  );
}

// ── record ──────────────────────────────────────────────────────────────────
function RecordStep({
  onStart,
  maxSeconds,
}: {
  onStart: () => void;
  maxSeconds: number;
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
      <p className="mt-4 font-mono text-[13px] text-text-3">
        {formatDuration(maxSeconds)}
      </p>
      <p className="mt-6 max-w-xs font-sans text-[14px] leading-relaxed text-text-2">
        Toca para grabar. Tienes hasta {Math.round(maxSeconds / 60)} minutos; di
        lo que quieras, con tus pausas.
      </p>
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

function Waveform() {
  return (
    <div className="mt-5 flex h-12 items-center justify-center gap-1.5" aria-hidden>
      {BARS.map((c, i) => (
        <span
          key={i}
          className={cn("w-1 rounded-pill", c)}
          style={{
            height: 40,
            transformOrigin: "center",
            animation: `fp-bar 1.1s ease-in-out ${i * 0.09}s infinite`,
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recorder.elapsed >= maxSeconds) onStop();
  }, [recorder.elapsed, maxSeconds, onStop]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [recorder.transcript]);

  const warn = recorder.elapsed >= maxSeconds - 60;

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 animate-pulse rounded-pill bg-grana" />
        <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-grana">
          REC
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

      <Waveform />

      <p className="mb-3 mt-6 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
        Transcribiendo en vivo
      </p>
      <div
        ref={scrollRef}
        className="max-h-32 w-full max-w-md overflow-y-auto rounded-[12px] border border-line bg-surface-2 p-4 text-left font-serif text-[15px] leading-[1.6]"
      >
        {recorder.transcript.length === 0 ? (
          <span className="text-text-3">…</span>
        ) : (
          recorder.transcript.map((w, i) => (
            <span
              key={i}
              className={
                i === recorder.transcript.length - 1 ? "text-ink" : "text-text-2"
              }
            >
              {w}{" "}
            </span>
          ))
        )}
      </div>

      <button
        type="button"
        aria-label="Detener"
        onClick={onStop}
        className="mt-8 grid h-[78px] w-[78px] place-items-center rounded-pill bg-grana text-white shadow-[0_10px_26px_-8px_rgba(192,48,58,.8)] transition-transform duration-150 ease-flow active:scale-[.94]"
      >
        <Square size={24} fill="currentColor" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="mt-4 font-sans text-[13px] text-text-3 underline underline-offset-2 hover:text-text-2"
      >
        Cancelar
      </button>
    </div>
  );
}

// ── processing ───────────────────────────────────────────────────────────────
function ProcessingStep({
  mode,
  onDone,
}: {
  mode: "polish" | "publish";
  onDone: () => void;
}) {
  const phases =
    mode === "polish"
      ? [
          {
            t: "Puliendo tu voz…",
            s: "Quitando muletillas y dándole forma de artículo.",
          },
          {
            t: "Generando la portada…",
            s: "Buscando la composición justa.",
          },
        ]
      : [{ t: "Publicando…", s: "Subiendo tu voz al Pub." }];
  const [i, setI] = useState(0);

  useEffect(() => {
    const dur = mode === "polish" ? [1200, 1100] : [1500];
    setI(0);
    const timers: number[] = [];
    let acc = 0;
    for (let k = 1; k < dur.length; k++) {
      acc += dur[k - 1];
      timers.push(window.setTimeout(() => setI(k), acc));
    }
    acc += dur[dur.length - 1];
    timers.push(window.setTimeout(onDone, acc));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [mode, onDone]);

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <FlowMark size={64} draw className="text-grana" />
      <p className="mt-8 font-serif text-[24px] text-ink">{phases[i].t}</p>
      <p className="mt-1 font-sans text-[14px] text-text-2">{phases[i].s}</p>
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
          onClick={() => {
            onChange(v);
            play("tick");
          }}
          className={cn(
            "rounded-pill px-3 py-1 font-sans text-[12px] font-semibold transition-colors duration-150",
            view === v
              ? "bg-surface text-ink shadow-[0_1px_2px_rgba(26,23,20,.08)]"
              : "text-text-3 hover:text-ink",
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
  duration: number;
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
  duration,
  onPublish,
  onSaveDraft,
}: EditStepProps) {
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [showT, setShowT] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* izquierda: portada + audio + transcript */}
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
            Portada generada
          </p>
          <div className="overflow-hidden rounded-[14px] border border-line">
            <Cover kind={COVER_KINDS[coverIndex]} seed={`compose-${coverIndex}`} />
          </div>
          <button
            type="button"
            onClick={cycleCover}
            className="mt-2 inline-flex items-center gap-2 rounded-pill border border-line-2 px-3.5 py-1.5 font-sans text-[13px] font-medium text-ink transition-colors hover:bg-[var(--hover)]"
          >
            <RefreshCw size={14} />
            Regenerar portada
          </button>
        </div>

        <div>
          <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
            Tu audio
          </p>
          <AudioPlayer durationSeconds={duration} variant="full" />
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
            Ver transcript original
          </button>
          {showT && (
            <div className="mt-2 rounded-[12px] border border-line bg-surface-2 p-4 font-serif text-[14.5px] leading-[1.6] text-text-2">
              {RAW_TRANSCRIPT}
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
            className="min-h-[260px] w-full resize-y rounded-[12px] border border-line bg-surface p-4 font-serif text-[17px] leading-[1.7] text-ink outline-none focus:border-grana"
          />
        ) : (
          <div className="min-h-[260px] rounded-[12px] border border-line bg-surface p-5">
            <FlowProse source={body} />
          </div>
        )}

        <div className="mt-6">
          <TagPicker selected={tags} onChange={setTags} />
        </div>

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
  onAnother,
}: {
  title: string;
  coverIndex: number;
  duration: number;
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
          <p className="mt-1 font-mono text-[12px] text-text-3">
            {formatDuration(duration)} de audio
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-pill bg-grana px-5 font-sans text-[15px] font-semibold text-white transition-colors hover:bg-grana-700"
        >
          Ver en el Pub
        </Link>
        <Button variant="secondary" onClick={onAnother}>
          Grabar otro
        </Button>
      </div>
    </div>
  );
}
