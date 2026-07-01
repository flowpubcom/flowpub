"use client";

import { Modal, Button } from "@/components/ui";
import { useI18n } from "@/providers/I18nProvider";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.4 5.4 0 0 1-2.4 3.58v2.97h3.86c2.26-2.09 3.56-5.17 3.56-8.79z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.97c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.32a7.2 7.2 0 0 1 0-4.63V6.6H1.29a12 12 0 0 0 0 10.81l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.29 6.6l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

/** Compuerta de auth al intentar grabar sin sesión. `onChoose` lleva a /entrar. */
export function AuthGateModal({
  open,
  onClose,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  /** Elegir un método → arranca el onboarding (/entrar). */
  onChoose?: () => void;
}) {
  const { t } = useI18n();
  const choose = onChoose ?? onClose;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("auth.title")}
      footer={
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={choose}
            className="flex w-full items-center justify-center gap-2.5 rounded-pill border border-[rgba(120,120,120,0.4)] bg-white py-3 font-sans text-[15px] font-semibold text-[#1A1714] transition-transform duration-150 ease-flow active:scale-[.98]"
          >
            <GoogleIcon />
            {t("auth.google")}
          </button>
          <Button fullWidth sound="pop" onClick={choose}>
            {t("auth.email")}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 font-sans text-[13px] text-text-3 underline underline-offset-2 transition-colors hover:text-text-2"
          >
            {t("auth.dismiss")}
          </button>
        </div>
      }
    >
      <p className="font-sans text-[14px] leading-relaxed text-text-2">
        {t("auth.body")}
      </p>
    </Modal>
  );
}
