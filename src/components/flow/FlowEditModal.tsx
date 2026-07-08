"use client";

import { useEffect, useState } from "react";
import { ImagePlus, RefreshCw } from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { FlowCover } from "@/components/cover";
import { ImageCropper } from "@/components/profile/ImageCropper";
import { TagPicker } from "@/components/compose/TagPicker";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { updateFlow } from "@/data/flowsClient";
import { uploadCover } from "@/data/storage";
import { fetchFlowTagNames, fetchTagNamesClient } from "@/data/tagsClient";
import { COVER_KINDS, type CoverKind } from "@/lib/covers";

/** Edición del Flow propio: título + artículo + portada + temas. El transcript
 *  crudo nunca se edita — es la voz. Reusado por el Pub, el perfil y el Flow
 *  abierto. onSaved(title, bodyMd) mantiene su firma: la portada y los temas se
 *  reflejan con el router.refresh() que ya hacen los tres llamadores. */
export function FlowEditModal({
  open,
  onClose,
  flowId,
  initialTitle,
  initialBody,
  initialCoverUrl,
  initialCoverKind,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  flowId: string;
  initialTitle: string;
  initialBody: string;
  initialCoverUrl?: string | null;
  initialCoverKind?: CoverKind;
  onSaved: (title: string, bodyMd: string) => void;
}) {
  const { t } = useI18n();
  const { play } = useSound();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl ?? null);
  const [coverKind, setCoverKind] = useState<CoverKind>(
    initialCoverKind ?? "collage",
  );
  const [coverUploading, setCoverUploading] = useState(false);
  const [pickedCoverFile, setPickedCoverFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<string[] | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al reabrir, parte del contenido vigente (por si otra edición ya lo cambió) y
  // trae los temas actuales del Flow + el catálogo de temas para elegir.
  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    setBody(initialBody);
    setCoverUrl(initialCoverUrl ?? null);
    setCoverKind(initialCoverKind ?? "collage");
    setError(null);
    let alive = true;
    void fetchFlowTagNames(flowId).then((names) => {
      if (alive) setTags(names);
    });
    void fetchTagNamesClient().then((names) => {
      if (alive) setTagOptions(names.length ? names : undefined);
    });
    return () => {
      alive = false;
    };
  }, [open, flowId, initialTitle, initialBody, initialCoverUrl, initialCoverKind]);

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
      setError(t("flow.editCoverError"));
      play("soft");
    }
  };

  const useGenerated = () => {
    setCoverUrl(null);
    play("soft");
  };

  const cycleCover = () => {
    const i = COVER_KINDS.indexOf(coverKind);
    setCoverKind(COVER_KINDS[(i + 1) % COVER_KINDS.length]);
    play("pop");
  };

  const save = async () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody || saving) return;
    setSaving(true);
    setError(null);
    const res = await updateFlow(flowId, {
      title: cleanTitle,
      bodyMd: cleanBody,
      coverUrl,
      coverKind,
      tagNames: tags,
    });
    setSaving(false);
    if (!res.ok) {
      setError(t("flow.editError"));
      play("soft");
      return;
    }
    if (res.coverDegraded) {
      // El texto y los temas se guardaron; la portada no (falta migración).
      setError(t("flow.editCoverDegraded"));
      play("soft");
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
      closeOnEscape={!pickedCoverFile}
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
      <p className="mb-4 font-sans text-[13px] text-text-2">{t("flow.editHint")}</p>

      {/* Portada */}
      <div className="mb-5">
        <span className="mb-1.5 block font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-text-2">
          {t("flow.editCover")}
        </span>
        <div className="overflow-hidden rounded-[12px] border border-line">
          <FlowCover coverUrl={coverUrl} kind={coverKind} seed={flowId} title={title} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!coverUrl && (
            <button
              type="button"
              onClick={cycleCover}
              className="inline-flex items-center gap-2 rounded-pill border border-line-2 px-3.5 py-1.5 font-sans text-[13px] font-medium text-ink transition-colors hover:bg-[var(--hover)]"
            >
              <RefreshCw size={14} />
              {t("flow.editCoverCycle")}
            </button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-line-2 px-3.5 py-1.5 font-sans text-[13px] font-medium text-ink transition-colors hover:bg-[var(--hover)]">
            <ImagePlus size={14} />
            {coverUploading
              ? t("flow.editCoverUploading")
              : coverUrl
                ? t("flow.editCoverChange")
                : t("flow.editCoverPhoto")}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={coverUploading}
              onChange={(e) => {
                pickCoverPhoto(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </label>
          {coverUrl && (
            <button
              type="button"
              onClick={useGenerated}
              className="inline-flex items-center gap-2 rounded-pill px-3 py-1.5 font-sans text-[13px] font-medium text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
            >
              <RefreshCw size={14} />
              {t("flow.editCoverGenerated")}
            </button>
          )}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-text-2">
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
        <span className="mb-1.5 block font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-text-2">
          {t("flow.editBody")}
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="max-h-[50vh] w-full resize-y rounded-[12px] border border-line bg-surface-2 px-3.5 py-2.5 font-serif text-[16px] leading-[1.6] text-ink outline-none focus:border-grana"
        />
      </label>

      {/* Temas */}
      <div className="mt-5">
        <span className="mb-1.5 block font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-text-2">
          {t("flow.editTags")}
        </span>
        <TagPicker
          selected={tags}
          onChange={setTags}
          options={tagOptions}
          allowCreate
        />
      </div>

      {error && (
        <p role="status" className="mt-3 font-sans text-[13px] text-grana-text">
          {error}
        </p>
      )}

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
    </Modal>
  );
}
