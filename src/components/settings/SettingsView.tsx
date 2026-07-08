"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, Modal, Switch } from "@/components/ui";
import { ThemeToggle } from "@/components/chrome/ThemeToggle";
import { LangToggle } from "@/components/chrome/LangToggle";
import { SoundToggle } from "@/components/chrome/SoundToggle";
import { useI18n } from "@/providers/I18nProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useLegal } from "@/providers/LegalProvider";
import { useSound } from "@/providers/SoundProvider";
import { createClient } from "@/lib/supabase/client";
import {
  deleteMyAccount,
  fetchPushPrefs,
  savePushPrefs,
  type PushPrefs,
} from "@/data/settingsClient";
import {
  disablePush,
  enablePush,
  pushState,
  type PushState,
} from "@/lib/push";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[16px] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
        {title}
      </h2>
      <div className="divide-y divide-line-soft">{children}</div>
    </section>
  );
}

function Row({
  title,
  detail,
  children,
}: {
  title: ReactNode;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="font-sans text-[14px] font-semibold text-ink">{title}</p>
        {detail && <p className="font-sans text-[12.5px] text-text-2">{detail}</p>}
      </div>
      <div className="flex-none">{children}</div>
    </div>
  );
}

export function SettingsView({ email }: { email: string }) {
  const { lang } = useI18n();
  const { play } = useSound();
  const { signOut } = useAuth();
  const { openLegal } = useLegal();
  const router = useRouter();
  const tr = (es: string, en: string) => (lang === "es" ? es : en);

  const [push, setPush] = useState<PushState>("off");
  const [prefs, setPrefs] = useState<PushPrefs>({
    messages: true,
    follows: true,
    comments: true,
  });
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  useEffect(() => {
    void pushState().then(setPush);
    void fetchPushPrefs().then(setPrefs);
  }, []);

  const togglePush = async () => {
    if (busy) return;
    setBusy(true);
    play("tick");
    setPush(push === "on" ? await disablePush() : await enablePush());
    setBusy(false);
  };

  const setPref = async (key: keyof PushPrefs, value: boolean) => {
    const prev = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const res = await savePushPrefs(next);
    if (!res.ok) setPrefs(prev);
  };

  const changePassword = async () => {
    if (!email) return;
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/restablecer`,
    });
    setResetSent(true);
    play("pop");
  };

  const doDelete = async () => {
    setDeleting(true);
    setDelError(null);
    const res = await deleteMyAccount();
    if (!res.ok) {
      setDeleting(false);
      setDelError(tr("No se pudo eliminar. Intenta de nuevo.", "Couldn't delete. Try again."));
      return;
    }
    router.push("/");
    router.refresh();
  };

  const CONFIRM = tr("ELIMINAR", "DELETE");
  const pushLabel =
    push === "unsupported"
      ? tr("Tu navegador no las soporta", "Your browser doesn't support them")
      : push === "denied"
        ? tr("Bloqueadas — actívalas en el navegador", "Blocked — enable them in your browser")
        : push === "on"
          ? tr("Activadas", "On")
          : tr("Desactivadas", "Off");

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5 px-4 pb-16 pt-6 lg:px-7">
      <div>
        <h1 className="font-serif text-[26px] font-medium leading-[1.15] text-ink">
          {tr("Configuración", "Settings")}
        </h1>
        <p className="mt-1 font-sans text-[13px] text-text-2">
          {tr(
            "Apariencia, notificaciones y tu cuenta.",
            "Appearance, notifications and your account.",
          )}
        </p>
      </div>

      {/* Apariencia */}
      <Card title={tr("Apariencia", "Appearance")}>
        <Row title={tr("Tema", "Theme")} detail={tr("Claro u oscuro (por defecto sigue a tu sistema).", "Light or dark (defaults to your system).")}>
          <ThemeToggle />
        </Row>
        <Row title={tr("Idioma", "Language")} detail={tr("Solo la interfaz; el contenido queda en su idioma.", "Interface only; content stays in its language.")}>
          <LangToggle />
        </Row>
        <Row title={tr("Sonidos", "Sounds")} detail={tr("Los blips sutiles al interactuar.", "The subtle blips on interaction.")}>
          <SoundToggle />
        </Row>
      </Card>

      {/* Notificaciones */}
      <Card title={tr("Notificaciones push", "Push notifications")}>
        <Row
          title={
            <span className="inline-flex items-center gap-2">
              <Bell size={15} /> {tr("Recibir notificaciones", "Receive notifications")}
            </span>
          }
          detail={pushLabel}
        >
          {push === "unsupported" || push === "denied" ? (
            <span className="font-mono text-[12px] text-text-3">—</span>
          ) : (
            <Switch
              checked={push === "on"}
              onCheckedChange={() => void togglePush()}
              label={tr("Notificaciones push", "Push notifications")}
            />
          )}
        </Row>
        <Row title={tr("Mensajes privados", "Private messages")} detail={tr("Cuando te escriben un DM.", "When someone DMs you.")}>
          <Switch
            checked={prefs.messages}
            disabled={push !== "on"}
            onCheckedChange={(v) => void setPref("messages", v)}
            label={tr("Mensajes privados", "Private messages")}
          />
        </Row>
        <Row title={tr("Nuevos seguidores", "New followers")} detail={tr("Cuando alguien te sigue.", "When someone follows you.")}>
          <Switch
            checked={prefs.follows}
            disabled={push !== "on"}
            onCheckedChange={(v) => void setPref("follows", v)}
            label={tr("Nuevos seguidores", "New followers")}
          />
        </Row>
        <Row title={tr("Comentarios", "Comments")} detail={tr("Cuando comentan uno de tus Flows.", "When someone comments on your Flow.")}>
          <Switch
            checked={prefs.comments}
            disabled={push !== "on"}
            onCheckedChange={(v) => void setPref("comments", v)}
            label={tr("Comentarios", "Comments")}
          />
        </Row>
      </Card>

      {/* Cuenta */}
      <Card title={tr("Cuenta", "Account")}>
        <Row title={tr("Correo", "Email")} detail={email || "—"}>
          <span className="font-mono text-[12px] text-text-3">{tr("privado", "private")}</span>
        </Row>
        <Row title={tr("Contraseña", "Password")} detail={resetSent ? tr("Te mandamos un correo para cambiarla.", "We emailed you a link to change it.") : tr("Te enviamos un enlace a tu correo.", "We'll email you a link.")}>
          <Button variant="secondary" size="sm" onClick={() => void changePassword()} disabled={resetSent || !email}>
            {tr("Cambiar", "Change")}
          </Button>
        </Row>
        <Row title={tr("Legales", "Legal")} detail={tr("Términos, privacidad y cookies.", "Terms, privacy and cookies.")}>
          <div className="flex gap-1.5 font-sans text-[13px]">
            <button type="button" className="text-grana-text hover:underline" onClick={() => openLegal("terminos")}>
              {tr("Términos", "Terms")}
            </button>
            <span className="text-text-3">·</span>
            <button type="button" className="text-grana-text hover:underline" onClick={() => openLegal("privacidad")}>
              {tr("Privacidad", "Privacy")}
            </button>
          </div>
        </Row>
        <Row title={tr("Sesión", "Session")}>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              play("click");
              await signOut();
              router.push("/");
            }}
          >
            <LogOut size={15} /> {tr("Cerrar sesión", "Sign out")}
          </Button>
        </Row>
      </Card>

      {/* Zona de peligro */}
      <section className="rounded-[16px] border border-grana/40 bg-grana-wash/40 p-5">
        <h2 className="mb-2 inline-flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-grana-700">
          <ShieldAlert size={14} /> {tr("Zona de peligro", "Danger zone")}
        </h2>
        <p className="max-w-[52ch] font-sans text-[13px] leading-relaxed text-text-2">
          {tr(
            "Eliminar tu cuenta es permanente. Se borran tus Flows, comentarios, mensajes y tu perfil. No hay vuelta atrás y no podremos recuperarlo.",
            "Deleting your account is permanent. Your Flows, comments, messages and profile are erased. There's no going back and we can't recover it.",
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            setConfirmText("");
            setDelError(null);
            setConfirmOpen(true);
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-pill border border-grana/50 px-4 py-2 font-sans text-[13px] font-semibold text-grana-700 transition-colors hover:bg-grana hover:text-white"
        >
          {tr("Eliminar mi cuenta", "Delete my account")}
        </button>
      </section>

      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title={tr("¿Eliminar tu cuenta?", "Delete your account?")}
      >
        <div className="flex flex-col gap-4 p-5">
          <p className="font-sans text-[14px] leading-relaxed text-text-2">
            {tr(
              `Esto es permanente. Para confirmar, escribe `,
              `This is permanent. To confirm, type `,
            )}
            <span className="font-mono font-semibold text-grana-700">{CONFIRM}</span>.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            aria-label={tr("Confirmación", "Confirmation")}
            autoCapitalize="characters"
            className="w-full rounded-md border border-line-2 bg-surface px-3.5 py-2.5 font-mono text-[15px] text-ink outline-none focus-visible:border-grana"
          />
          {delError && <p role="status" className="font-sans text-[13px] text-grana">{delError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              {tr("Cancelar", "Cancel")}
            </Button>
            <button
              type="button"
              onClick={() => void doDelete()}
              disabled={confirmText.trim().toUpperCase() !== CONFIRM || deleting}
              className="inline-flex h-11 items-center gap-2 rounded-pill bg-grana px-5 font-sans text-[15px] font-semibold text-white transition-colors hover:bg-grana-700 disabled:opacity-40"
            >
              {deleting ? tr("Eliminando…", "Deleting…") : tr("Eliminar definitivamente", "Delete permanently")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
