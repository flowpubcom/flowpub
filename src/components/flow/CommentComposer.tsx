"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Send, Square } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";
import { useSound } from "@/providers/SoundProvider";
import { formatDuration } from "@/lib/format";
import { GUEST, type Comment } from "@/data/comments";

let counter = 0;
const newId = () => `n${++counter}`;

const WAVE = ["bg-grana", "bg-ocre", "bg-grana", "bg-ink", "bg-grana", "bg-ocre", "bg-grana"];

function MiniWave() {
  return (
    <div className="flex h-8 items-center gap-1" aria-hidden>
      {WAVE.map((c, i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-pill", c)}
          style={{ height: 24, transformOrigin: "center", animation: `fp-bar 1s ease-in-out ${i * 0.1}s infinite` }}
        />
      ))}
    </div>
  );
}

export function CommentComposer({ onPost }: { onPost: (c: Comment) => void }) {
  const { play } = useSound();
  const [tab, setTab] = useState<"text" | "voice">("text");
  const [text, setText] = useState("");

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef(0);

  const sendText = () => {
    const body = text.trim();
    if (!body) return;
    play("pop");
    onPost({
      id: newId(),
      author: GUEST,
      kind: "text",
      text: body,
      ageMinutes: 0,
      likeCount: 0,
      liked: false,
    });
    setText("");
  };

  const startVoice = () => {
    play("rec");
    setRecording(true);
    setElapsed(0);
    startRef.current = performance.now();
    timerRef.current = window.setInterval(
      () => setElapsed((performance.now() - startRef.current) / 1000),
      200,
    );
  };

  const stopVoice = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    const dur = Math.max(2, Math.round((performance.now() - startRef.current) / 1000));
    setRecording(false);
    play("pop");
    onPost({
      id: newId(),
      author: GUEST,
      kind: "voice",
      audioDurationSeconds: dur,
      transcript:
        "este es el transcript simulado de tu comentario de voz; con Gemini será el real.",
      ageMinutes: 0,
      likeCount: 0,
      liked: false,
    });
    setElapsed(0);
  };

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    },
    [],
  );

  return (
    <div className="rounded-[16px] border border-line bg-surface p-4">
      <div className="mb-3 inline-flex rounded-pill bg-surface-2 p-[3px]">
        {(["text", "voice"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setTab(v);
              play("tick");
            }}
            className={cn(
              "rounded-pill px-3.5 py-1 font-sans text-[12px] font-semibold transition-colors duration-150",
              tab === v
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(26,23,20,.08)]"
                : "text-text-3 hover:text-ink",
            )}
          >
            {v === "text" ? "Escribir" : "Comentar con voz"}
          </button>
        ))}
      </div>

      {tab === "text" ? (
        <div className="flex items-end gap-2">
          <Avatar name="Tú" color="grana" size={34} className="flex-none" />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder="Suma tu voz…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
            className="min-h-[40px] flex-1 resize-none rounded-[12px] border border-line bg-surface-2 px-3 py-2 font-sans text-[15px] text-ink outline-none focus:border-grana"
          />
          <button
            type="button"
            onClick={sendText}
            disabled={!text.trim()}
            aria-label="Enviar"
            className="grid h-10 w-10 flex-none place-items-center rounded-pill bg-grana text-white transition-transform duration-150 ease-flow active:scale-[.95] disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      ) : (
        <div className="flex min-h-[40px] items-center gap-3">
          {!recording ? (
            <button
              type="button"
              onClick={startVoice}
              className="inline-flex items-center gap-2 rounded-pill bg-grana px-4 py-2.5 font-sans text-[14px] font-semibold text-white transition-transform duration-150 ease-flow active:scale-[.97]"
            >
              <Mic size={16} />
              Grabar comentario
            </button>
          ) : (
            <>
              <span className="flex items-center gap-2 font-mono text-[14px] tabular-nums text-grana">
                <span className="h-2 w-2 animate-pulse rounded-pill bg-grana" />
                {formatDuration(elapsed)}
              </span>
              <div className="flex-1">
                <MiniWave />
              </div>
              <button
                type="button"
                onClick={stopVoice}
                aria-label="Detener"
                className="grid h-10 w-10 flex-none place-items-center rounded-pill bg-grana text-white transition-transform duration-150 ease-flow active:scale-[.94]"
              >
                <Square size={16} fill="currentColor" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
