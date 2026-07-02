"use client";

import { useEffect, useState } from "react";
import { Mic, Send, Square } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSound } from "@/providers/SoundProvider";
import { useRecorder } from "@/lib/useRecorder";
import { useI18n } from "@/providers/I18nProvider";
import { sendTextMessage, sendVoiceMessage } from "@/data/messagesClient";
import { formatDuration } from "@/lib/format";
import type { DirectMessage } from "@/data/messages";

const MAX_VOICE = 90;
const BARS = ["bg-grana", "bg-grana", "bg-ocre", "bg-grana", "bg-ink", "bg-grana"];

function RecBars() {
  return (
    <div className="flex h-[28px] items-center gap-[3px] px-1.5" aria-hidden>
      {BARS.map((c, i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-[9px]", c)}
          style={{ height: 24, transformOrigin: "center", animation: `fp-bar 1s ease-in-out ${i * 0.12}s infinite` }}
        />
      ))}
    </div>
  );
}

export function MessageComposer({
  convId,
  onSend,
}: {
  convId: string;
  onSend: (m: DirectMessage) => void;
}) {
  const { play } = useSound();
  const { t } = useI18n();
  const recorder = useRecorder(MAX_VOICE);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "processing">("idle");
  const [error, setError] = useState<string | null>(null);

  const sendText = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const res = await sendTextMessage(convId, body);
    setSending(false);
    if (!res.ok) {
      setError(t("msg.sendError"));
      play("soft");
      return;
    }
    play("pop");
    onSend(res.message);
    setText("");
  };

  const startVoice = async () => {
    setError(null);
    play("rec");
    const ok = await recorder.start();
    if (ok) setVoiceState("recording");
  };

  const stopAndSend = async () => {
    const result = await recorder.stop();
    if (!result) {
      setVoiceState("idle");
      play("soft");
      return;
    }
    setVoiceState("processing");
    const res = await sendVoiceMessage(convId, result.blob, result.durationSeconds);
    if (!res.ok) {
      setVoiceState("idle");
      setError(res.error === "transcribe" ? t("msg.voiceError") : t("msg.sendError"));
      play("soft");
      return;
    }
    play("pop");
    onSend(res.message);
    setVoiceState("idle");
  };

  // Tope duro: al llegar al máximo, detiene y envía solo.
  useEffect(() => {
    if (voiceState === "recording" && recorder.elapsed >= MAX_VOICE) {
      void stopAndSend();
    }

  }, [recorder.elapsed, voiceState]);

  return (
    <div className="flex-none border-t border-line-soft px-[18px] py-[14px]">
      {voiceState === "idle" && (
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendText();
              }
            }}
            placeholder={t("msg.placeholder")}
            aria-label={t("msg.placeholder")}
            className="min-w-0 flex-1 rounded-pill border border-line-2 bg-transparent px-4 py-3 font-sans text-[14px] text-ink outline-none transition-colors focus:border-grana"
          />
          <button
            type="button"
            onClick={() => void startVoice()}
            aria-label={t("msg.record")}
            className="grid h-11 w-11 flex-none place-items-center rounded-pill border border-line-2 text-grana transition-colors hover:bg-grana-wash"
          >
            <Mic size={19} />
          </button>
          <button
            type="button"
            onClick={() => void sendText()}
            disabled={!text.trim() || sending}
            aria-label={t("msg.send")}
            className="grid h-11 w-11 flex-none place-items-center rounded-pill bg-grana text-white transition-colors hover:bg-grana-700 disabled:opacity-40"
          >
            <Send size={19} />
          </button>
        </div>
      )}

      {voiceState === "recording" && (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 font-mono text-[13px] font-bold tabular-nums text-grana">
            <span className="h-2 w-2 animate-pulse rounded-pill bg-grana" />
            {formatDuration(recorder.elapsed)}
          </span>
          <div className="flex-1">
            <RecBars />
          </div>
          <button
            type="button"
            onClick={() => void stopAndSend()}
            aria-label={t("msg.send")}
            className="grid h-11 w-11 flex-none place-items-center rounded-pill bg-grana text-white transition-transform duration-150 ease-flow active:scale-[.94]"
          >
            <Square size={16} fill="currentColor" />
          </button>
        </div>
      )}

      {voiceState === "processing" && (
        <p role="status" className="px-1 py-3 font-sans text-[14px] text-text-2">
          {t("msg.transcribing")}
        </p>
      )}

      {(error || recorder.error) && (
        <p role="status" className="mt-2 px-1 font-sans text-[13px] text-grana">
          {error ?? recorder.error}
        </p>
      )}
    </div>
  );
}
