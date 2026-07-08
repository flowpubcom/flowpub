"use client";

import { useEffect, useRef, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { useI18n } from "@/providers/I18nProvider";

// Editor de imagen reutilizable: arrastra para encuadrar, desliza para acercar.
// El visor YA es el recorte final (WYSIWYG) — círculo para el avatar (1:1) o
// rectángulo 16:9 para la portada del Flow. Exporta un JPEG con el aspecto
// pedido; el círculo lo recorta el <Avatar> por CSS, así que no se hornea.

const OUT_W = 1280; // ancho del archivo exportado; el alto sale del aspecto

export function ImageCropper({
  file,
  aspect = 1,
  round = false,
  title,
  hint,
  confirmLabel,
  onClose,
  onCropped,
}: {
  file: File;
  /** ancho/alto del recorte (1 = cuadrado, 16/9 = portada). */
  aspect?: number;
  /** visor circular (avatar) vs. rectángulo (portada). */
  round?: boolean;
  title: string;
  hint: string;
  confirmLabel: string;
  onClose: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const { t } = useI18n();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(
    null,
  );

  // Dimensiones del visor: los cuadrados (avatar) más chicos que los anchos.
  const VIEW_W = round ? 248 : 300;
  const VIEW_H = Math.round(VIEW_W / aspect);
  const outW = OUT_W;
  const outH = Math.round(OUT_W / aspect);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const cover = Math.max(VIEW_W / im.naturalWidth, VIEW_H / im.naturalHeight);
      const w = im.naturalWidth * cover;
      const h = im.naturalHeight * cover;
      setPos({ x: (VIEW_W - w) / 2, y: (VIEW_H - h) / 2 });
      setZoom(1);
      setImg(im);
    };
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, VIEW_W, VIEW_H]);

  if (!img) return null; // carga local casi instantánea; sin skeleton

  const cover = Math.max(VIEW_W / img.naturalWidth, VIEW_H / img.naturalHeight);
  const dispW = img.naturalWidth * cover * zoom;
  const dispH = img.naturalHeight * cover * zoom;

  const clamp = (x: number, y: number, w = dispW, h = dispH) => ({
    x: Math.min(0, Math.max(VIEW_W - w, x)),
    y: Math.min(0, Math.max(VIEW_H - h, y)),
  });

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    setPos(clamp(d.ox + (e.clientX - d.sx), d.oy + (e.clientY - d.sy)));
  };
  const endDrag = () => {
    dragRef.current = null;
  };

  const changeZoom = (z: number) => {
    setZoom(z);
    // El zoom puede achicar la imagen visible: re-clampa para no dejar hueco.
    const w = img.naturalWidth * cover * z;
    const h = img.naturalHeight * cover * z;
    setPos((p) => clamp(p.x, p.y, w, h));
  };

  const confirm = () => {
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = outW / VIEW_W; // visor → salida (mismo aspecto, un solo factor)
    ctx.drawImage(img, pos.x * s, pos.y * s, dispW * s, dispH * s);
    canvas.toBlob(
      (blob) => {
        if (blob) onCropped(blob);
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      className="w-[360px]"
      footer={
        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" sound="soft" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button sound={null} onClick={confirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="mb-4 font-sans text-[13px] text-text-2">{hint}</p>
      <div className="flex flex-col items-center gap-4">
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          style={{ width: VIEW_W, height: VIEW_H }}
          className={cropClass(round)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.src}
            alt=""
            draggable={false}
            className="absolute max-w-none select-none"
            style={{ width: dispW, height: dispH, left: pos.x, top: pos.y }}
          />
        </div>
        <label className="flex w-full items-center gap-3">
          <span className="font-sans text-[12px] text-text-2">{t("crop.zoom")}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            aria-label={t("crop.zoom")}
            onChange={(e) => changeZoom(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer accent-[var(--grana)]"
          />
        </label>
      </div>
    </Modal>
  );
}

function cropClass(round: boolean): string {
  const base =
    "relative cursor-grab touch-none overflow-hidden border-2 border-line-2 bg-surface-2 active:cursor-grabbing";
  return round ? `${base} rounded-pill` : `${base} rounded-[14px]`;
}
