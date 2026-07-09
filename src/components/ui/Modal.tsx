"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Id de un heading propio del contenido (cuando no se usa `title`). */
  labelledBy?: string;
  /** Cerrar con Escape. Ponlo en false mientras haya un modal anidado encima
   *  (p. ej. el recorte de imagen), para que Escape no cierre también al padre. */
  closeOnEscape?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Diálogo accesible (portal a body, Esc, scroll lock, foco gestionado). */
export function Modal({
  open,
  onClose,
  title,
  labelledBy,
  closeOnEscape = true,
  children,
  footer,
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Trampa de foco: Tab/Shift+Tab no debe escapar al fondo (WCAG 2.4.3). En los
  // extremos, cicla dentro del panel; con 0/1 enfocables mantiene el foco en el
  // propio panel (que ya es tabIndex=-1 y recibió foco al abrir).
  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    if (focusables.length === 0) {
      e.preventDefault();
      panel.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      // Al inicio (o fuera del set) hacia atrás → salta al último.
      if (active === first || !panel.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Al final (o fuera del set) hacia adelante → vuelve al primero.
      if (active === last || !panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  // Foco + scroll lock: solo depende de `open` (no re-corre al cambiar
  // closeOnEscape, así no hay churn de foco cuando se abre un modal anidado).
  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusId);
      prevFocus.current?.focus?.();
    };
  }, [open]);

  // Listener de Escape aparte, con closeOnEscape en deps: al abrirse un modal
  // encima (que pone closeOnEscape=false), este effect re-corre y RETIRA el
  // listener del padre — así Escape sobre el hijo no cierra también al padre.
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEscape, onClose]);

  if (!mounted || !open) return null;

  const titleId = title ? "fp-modal-title" : labelledBy;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[var(--scrim)] p-4 backdrop-blur-[6px] [animation:fp-fade_.18s_ease-out]"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onPanelKeyDown}
        className={cn(
          // flex-col + cap de viewport: cuando el contenido es alto, el CUERPO
          // hace scroll y el footer (Guardar/Cancelar) queda siempre a la vista.
          "flex max-h-[calc(100dvh-2rem)] w-[380px] max-w-[90vw] flex-col rounded-[20px] border border-line bg-surface p-[30px] shadow-[var(--shadow-window)] outline-none [animation:fp-modal_.24s_var(--ease-flow)]",
          className,
        )}
      >
        {title && (
          <h2
            id={titleId}
            className="mb-2 flex-none font-serif text-[24px] font-medium text-ink"
          >
            {title}
          </h2>
        )}
        {/* Con footer: cuerpo desplazable + footer fijo. Sin footer (p. ej. el
            visor legal), el contenido se renderiza directo y maneja su propia
            altura/scroll con el className que pase. */}
        {footer ? (
          <>
            <div className="-mr-3 min-h-0 flex-1 overflow-y-auto pr-3">
              {children}
            </div>
            <div className="mt-6 flex-none">{footer}</div>
          </>
        ) : (
          children
        )}
      </div>
    </div>,
    document.body,
  );
}
