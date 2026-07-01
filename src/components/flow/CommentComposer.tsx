"use client";

import { useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";
import { useSound } from "@/providers/SoundProvider";
import { useAuth } from "@/providers/AuthProvider";
import { postTextComment } from "@/data/commentsClient";
import type { Comment } from "@/data/comments";

export function CommentComposer({
  flowId,
  onPost,
}: {
  flowId: string;
  onPost: (c: Comment) => void;
}) {
  const { play } = useSound();
  const { user } = useAuth();
  const [tab, setTab] = useState<"text" | "voice">("text");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // Solo con sesión se comenta (RLS lo exige). Invitado → compuerta a /entrar.
  if (!user) {
    return (
      <div className="rounded-[16px] border border-line bg-surface-2 p-5 text-center">
        <p className="font-sans text-[14px] text-text-2">
          Para sumar tu voz,{" "}
          <Link href="/entrar" className="font-semibold text-grana">
            entra a FlowPub
          </Link>
          .
        </p>
      </div>
    );
  }

  const sendText = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const res = await postTextComment(flowId, body);
    setSending(false);
    if (!res.ok) {
      play("soft");
      return;
    }
    play("pop");
    onPost({
      id: res.id,
      author: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        avatarUrl: user.avatarUrl,
      },
      kind: "text",
      text: body,
      ageMinutes: 0,
      likeCount: 0,
      liked: false,
    });
    setText("");
  };

  return (
    <div className="rounded-[16px] border border-line bg-surface p-4">
      <div className="mb-3 inline-flex rounded-pill bg-surface-2 p-[3px]">
        {(["text", "voice"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={tab === v}
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
          <Avatar
            name={user.displayName}
            src={user.avatarUrl}
            color={user.avatarColor}
            size={34}
            className="flex-none"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder="Suma tu voz…"
            aria-label="Escribe un comentario"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendText();
              }
            }}
            className="min-h-[40px] flex-1 resize-none rounded-[12px] border border-line bg-surface-2 px-3 py-2 font-sans text-[15px] text-ink outline-none focus:border-grana"
          />
          <button
            type="button"
            onClick={() => void sendText()}
            disabled={!text.trim() || sending}
            aria-label="Enviar"
            className="grid h-10 w-10 flex-none place-items-center rounded-pill bg-grana text-white transition-transform duration-150 ease-flow active:scale-[.95] disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      ) : (
        <p className="px-1 py-2 font-sans text-[14px] text-text-3">
          Los comentarios de voz llegan pronto —con transcripción por Gemini.
        </p>
      )}
    </div>
  );
}
