"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Diálogo accesible (portal a body, Esc, scroll lock, foco gestionado). */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusId);
      prevFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const titleId = title ? "fp-modal-title" : undefined;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(10,8,6,.55)] p-4 backdrop-blur-[6px] [animation:fp-fade_.18s_ease-out]"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-[380px] max-w-[90vw] rounded-[20px] border border-line bg-surface p-[30px] shadow-[var(--shadow-window)] outline-none [animation:fp-modal_.24s_var(--ease-flow)]",
          className,
        )}
      >
        {title && (
          <h2
            id={titleId}
            className="mb-2 font-serif text-[24px] font-medium text-ink"
          >
            {title}
          </h2>
        )}
        {children}
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
