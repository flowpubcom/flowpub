"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { fetchMyInvites, type MyInvites } from "@/data/invitesClient";

// Tarjeta «Invitaciones» del perfil propio: 6 códigos para correr la voz.
// Cada enlace es de un solo uso; al gastarse, se ofrece el siguiente.

export function InvitesCard() {
  const { t } = useI18n();
  const { play } = useSound();
  const [invites, setInvites] = useState<MyInvites | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchMyInvites().then((v) => {
      if (alive) setInvites(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Sin datos (migración pendiente o sin sesión): la tarjeta no aparece.
  if (!invites) return null;

  const url = invites.nextCode
    ? `${window.location.origin}/i/${invites.nextCode}`
    : null;

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      play("pop");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      play("soft");
    }
  };

  const whatsapp = () => {
    if (!url) return;
    play("click");
    const text = `${t("invite.waText")} ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section className="mt-6 rounded-[16px] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
          {t("invite.title")}
        </h2>
        <span className="font-mono text-[12px] text-text-2">
          {invites.unlimited
            ? t("invite.unlimited")
            : t("invite.remaining", { n: invites.remaining })}
        </span>
      </div>

      {url ? (
        <>
          <p className="mt-2 font-sans text-[13px] text-text-2">
            {t("invite.hint")}
          </p>
          <p className="mt-3 truncate rounded-[10px] border border-line bg-surface-2 px-3 py-2 font-mono text-[12px] text-ink">
            {url}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void whatsapp()}
              className="inline-flex h-10 items-center gap-2 rounded-pill bg-grana px-4 font-sans text-[13px] font-semibold text-white transition-colors hover:bg-grana-700"
            >
              <Send size={14} />
              {t("invite.whatsapp")}
            </button>
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex h-10 items-center gap-2 rounded-pill border border-line-2 px-4 font-sans text-[13px] font-semibold text-ink transition-colors hover:bg-[var(--hover)]"
            >
              {copied ? <Check size={14} className="text-ok" /> : <Copy size={14} />}
              {copied ? t("invite.copied") : t("invite.copy")}
            </button>
          </div>
        </>
      ) : (
        <p className="mt-2 font-sans text-[13px] text-text-2">
          {t("invite.none")}
        </p>
      )}
    </section>
  );
}
