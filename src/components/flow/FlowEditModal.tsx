"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { updateFlow } from "@/data/flowsClient";

/** Edición del Flow propio: título + artículo (markdown). El transcript crudo
 *  nunca se edita — es la voz. Reusado por el Pub, el perfil y el Flow abierto. */
export function FlowEditModal({
  open,
  onClose,
  flowId,
  initialTitle,
  initialBody,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  flowId: string;
  initialTitle: string;
  initialBody: string;
  onSaved: (title: string, bodyMd: string) => void;
}) {
  const { t } = useI18n();
  const { play } = useSound();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al reabrir, parte del contenido vigente (por si otra edición ya lo cambió).
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setBody(initialBody);
      setError(null);
    }
  }, [open, initialTitle, initialBody]);

  const save = async () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody || saving) return;
    setSaving(true);
    setError(null);
    const res = await updateFlow(flowId, { title: cleanTitle, bodyMd: cleanBody });
    setSaving(false);
    if (!res.ok) {
      setError(t("flow.editError"));
      play("soft");
      return;
    }
    play("pop");
    onSaved(cleanTitle, cleanBody);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("flow.edit")}
      className="w-[560px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            onClick={() => void save()}
            disabled={!title.trim() || !body.trim() || saving}
          >
            {t("profile.saveChanges")}
          </Button>
        </div>
      }
    >
      <p className="mb-4 font-sans text-[13px] text-text-3">{t("flow.editHint")}</p>

      <label className="block">
        <span className="mb-1.5 block font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-text-3">
          {t("flow.editTitle")}
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          className="w-full rounded-[12px] border border-line bg-surface-2 px-3.5 py-2.5 font-serif text-[18px] text-ink outline-none focus:border-grana"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-text-3">
          {t("flow.editBody")}
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="max-h-[50vh] w-full resize-y rounded-[12px] border border-line bg-surface-2 px-3.5 py-2.5 font-serif text-[16px] leading-[1.6] text-ink outline-none focus:border-grana"
        />
      </label>

      {error && (
        <p role="status" className="mt-3 font-sans text-[13px] text-grana-text">
          {error}
        </p>
      )}
    </Modal>
  );
}
