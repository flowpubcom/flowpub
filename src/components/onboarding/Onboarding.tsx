"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera, Check, ChevronLeft, Eye, EyeOff, Mail, Mic } from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  completeOnboarding,
  isUsernameAvailable,
  isValidUsername,
  normalizeUsername,
  uploadAvatar,
} from "@/data/profileApi";
import { redeemInvite } from "@/data/invitesClient";
import { tagName, type TagRow } from "@/data/tags";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { FlowMark } from "@/components/brand";
import { useLegal } from "@/providers/LegalProvider";
import { ImageCropper } from "@/components/profile/ImageCropper";
import { BrandHypnotic, BrandLockup } from "./BrandHypnotic";
import { Turnstile, captchaEnabled } from "./Turnstile";

type Step = "auth" | "themes" | "profile" | "ready";
type AuthMode = "choose" | "signup" | "login" | "forgot";
type AvailState = "idle" | "checking" | "free" | "taken";

const inputCls =
  "w-full rounded-md border border-line-2 bg-surface px-3.5 py-3 font-sans text-[15px] text-ink outline-none transition-colors placeholder:text-text-3 focus-visible:border-grana";

const granaBtn =
  "flex items-center justify-center gap-2.5 rounded-pill bg-grana px-6 py-3.5 font-sans text-[15px] font-semibold text-white shadow-[var(--shadow-grana)] transition-[transform,opacity] duration-150 ease-flow active:scale-[.98] disabled:cursor-not-allowed";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.4 5.4 0 0 1-2.4 3.58v2.97h3.86c2.26-2.09 3.56-5.17 3.56-8.79z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.97c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.32a7.2 7.2 0 0 1 0-4.63V6.6H1.29a12 12 0 0 0 0 10.81l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.29 6.6l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

export function Onboarding({
  tags,
  initialMode,
}: {
  tags: TagRow[];
  initialMode?: "signup" | "login";
}) {
  const { t, lang } = useI18n();
  const { play } = useSound();
  const { user, refresh } = useAuth();
  const { openLegal } = useLegal();
  const router = useRouter();

  const [step, setStep] = useState<Step>("auth");
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode ?? "choose");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  // Foto de perfil: si entró por Google, el trigger de alta ya la trajo
  // (raw_user_meta_data.avatar_url) — se precarga sola, sin pedirla de nuevo.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pickedAvatarFile, setPickedAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<DictKey | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [shakeId, setShakeId] = useState<number | null>(null);
  const [avail, setAvail] = useState<AvailState>("idle");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaReset = useRef<(() => void) | null>(null);

  const usernameNorm = normalizeUsername(username);

  // ¿Llegó con invitación (?invite= o la landing /i/CODIGO)? Se guarda para
  // canjearla al terminar de crear la cuenta (sobrevive el redirect OAuth).
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get("invite");
      if (code && /^[a-f0-9]{8}$/i.test(code)) {
        localStorage.setItem("fp-invite", code);
      }
    } catch {
      /* noop */
    }
  }, []);

  // Sesión ya presente en el paso de auth: salta el auth (OAuth / login previo).
  useEffect(() => {
    if (!user || step !== "auth") return;
    if (user.onboarded) {
      router.replace("/");
      return;
    }
    setStep("themes");
    setDisplayName((v) => v || user.displayName);
    setAvatarUrl((v) => v ?? user.avatarUrl ?? null);
  }, [user, step, router]);

  const onPickAvatar = (file: File | null) => {
    if (!file) return;
    play("click");
    setPickedAvatarFile(file);
  };

  const onCroppedAvatar = async (blob: Blob) => {
    setPickedAvatarFile(null);
    setAvatarUploading(true);
    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
    const url = await uploadAvatar(file);
    setAvatarUploading(false);
    if (url) {
      setAvatarUrl(url);
      play("pop");
    } else {
      setError("onb.err.generic");
      play("soft");
    }
  };

  // Disponibilidad de usuario (debounce).
  useEffect(() => {
    const u = normalizeUsername(username);
    if (u.length < 3) {
      setAvail("idle");
      return;
    }
    setAvail("checking");
    let active = true;
    const id = window.setTimeout(async () => {
      const ok = await isUsernameAvailable(u);
      if (active) setAvail(ok ? "free" : "taken");
    }, 420);
    return () => {
      active = false;
      window.clearTimeout(id);
    };
  }, [username]);

  const onGoogle = async () => {
    play("click");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/entrar`,
      },
    });
  };

  const onSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("onb.err.weakPassword");
      play("soft");
      return;
    }
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/entrar`,
        captchaToken: captchaToken ?? undefined,
      },
    });
    setSubmitting(false);
    if (err) {
      setError(
        err.message?.toLowerCase().includes("already")
          ? "onb.err.emailInUse"
          : "onb.err.generic",
      );
      captchaReset.current?.(); // token de un solo uso
      play("soft");
      return;
    }
    if (data.session) {
      play("pop");
      await refresh();
      setStep("themes");
    } else {
      setCheckEmail(true);
      play("soft");
    }
  };

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: captchaToken ?? undefined },
    });
    setSubmitting(false);
    if (err) {
      setError("onb.err.credentials");
      captchaReset.current?.(); // token de un solo uso
      play("soft");
      return;
    }
    play("pop");
    await refresh();
    // El efecto de arriba enruta: onboarded → «/», si no → temas.
  };

  const onForgot = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    // El enlace del correo pasa por /auth/callback (intercambia el code por
    // sesión) y aterriza en /restablecer con sesión viva.
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/restablecer`,
      captchaToken: captchaToken ?? undefined,
    });
    setSubmitting(false);
    if (err) {
      setError("onb.err.generic");
      captchaReset.current?.(); // token de un solo uso
      play("soft");
      return;
    }
    play("pop");
    setResetSent(true);
  };

  const toggleTag = (id: number) => {
    setError(null);
    if (selected.includes(id)) {
      setSelected((s) => s.filter((x) => x !== id));
      play("soft");
      return;
    }
    if (selected.length >= 3) {
      setShakeId(id);
      play("soft");
      window.setTimeout(() => setShakeId(null), 280);
      return;
    }
    setSelected((s) => [...s, id]);
    play("pop");
  };

  const onCreatePub = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("onb.err.generic");
      return;
    }
    if (!isValidUsername(usernameNorm)) {
      setError("onb.profile.usernameMin");
      play("soft");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await completeOnboarding({
      displayName,
      username: usernameNorm,
      bio,
      tagIds: selected,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(
        res.error === "username-taken"
          ? "onb.err.usernameTaken"
          : "onb.err.generic",
      );
      play("soft");
      return;
    }
    play("pop");
    // Si llegó con una invitación (/i/CODIGO la dejó en localStorage), se
    // canjea aquí: enlaza con quien invitó y se siguen mutuamente.
    try {
      const inviteCode = localStorage.getItem("fp-invite");
      if (inviteCode) {
        await redeemInvite(inviteCode);
        localStorage.removeItem("fp-invite");
      }
    } catch {
      /* best-effort: la cuenta ya quedó; la invitación no bloquea */
    }
    await refresh();
    setStep("ready");
  };

  const goStep = (s: Step) => {
    play("click");
    setError(null);
    setStep(s);
  };

  // ── Piezas compartidas ────────────────────────────────────────────────────

  // Crédito del creador — al pie del onboarding, para que los invitados (también
  // en móvil) puedan llegar a él. `dark` = sobre el abismo de marca.
  const creditFoot = (dark = false) => (
    <a
      href="https://juliosahagunsanchez.com/"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "font-sans text-[11px] underline-offset-2 transition-colors hover:underline",
        !dark && "text-grana-text",
      )}
      style={dark ? { color: "#EC9DA2" } : undefined}
    >
      {t("credit")}
    </a>
  );

  const errText = (dark = false) =>
    error ? (
      <p
        id="onb-error"
        role="status"
        className={cn(
          "font-sans text-[13px]",
          dark ? "text-[#EC9DA2]" : "text-grana",
        )}
      >
        {t(error)}
      </p>
    ) : null;

  const emailPassFields = () => (
    <>
      <label className="block">
        <span className="mb-1.5 block font-sans text-[13px] font-semibold text-text-2">
          {t("onb.email.label")}
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("onb.email.placeholder")}
          aria-invalid={!!error}
          aria-describedby={error ? "onb-error" : undefined}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-sans text-[13px] font-semibold text-text-2">
          {t("onb.password.label")}
        </span>
        <span className="relative block">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete={authMode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("onb.password.placeholder")}
            aria-invalid={!!error}
            aria-describedby={error ? "onb-error" : undefined}
            className={cn(inputCls, "pr-11")}
          />
          <button
            type="button"
            // preventDefault en el *down*: el botón no roba el foco del input
            // y el teclado móvil se queda abierto mientras alternas el ojo.
            onPointerDown={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              play("tick");
              setShowPassword((v) => !v);
            }}
            aria-pressed={showPassword}
            aria-label={t(showPassword ? "onb.password.hide" : "onb.password.show")}
            className="absolute right-[3px] top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-pill text-text-2 transition-colors hover:text-ink"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </span>
      </label>
    </>
  );

  /** Formulario de correo (signup/login), siempre sobre superficie clara. */
  const authFormLight = () => {
    if (checkEmail) {
      return (
        <div className="max-w-[380px]">
          <p className="font-sans text-[15px] leading-relaxed text-text-2">
            {t("onb.check.email")}
          </p>
        </div>
      );
    }
    if (authMode === "forgot") {
      if (resetSent) {
        return (
          <div className="max-w-[380px]">
            <p className="font-sans text-[15px] leading-relaxed text-text-2">
              {t("onb.forgot.sent")}
            </p>
          </div>
        );
      }
      return (
        <form onSubmit={onForgot} className="flex max-w-[380px] flex-col gap-3.5">
          <label className="block">
            <span className="mb-1.5 block font-sans text-[13px] font-semibold text-text-2">
              {t("onb.email.label")}
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("onb.email.placeholder")}
              aria-invalid={!!error}
              aria-describedby={error ? "onb-error" : undefined}
              className={inputCls}
            />
          </label>
          <Turnstile onToken={setCaptchaToken} resetRef={captchaReset} />
          {errText()}
          <button
            type="submit"
            disabled={submitting || (captchaEnabled && !captchaToken)}
            className={cn(
              granaBtn,
              (submitting || (captchaEnabled && !captchaToken)) && "opacity-60",
            )}
          >
            {t("onb.forgot.submit")}
          </button>
          <p className="mt-1 font-sans text-[13px] text-text-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setAuthMode("login");
              }}
              className="font-semibold text-grana-text"
            >
              {t("onb.login")}
            </button>
          </p>
        </form>
      );
    }
    const isLogin = authMode === "login";
    return (
      <div className="flex max-w-[380px] flex-col gap-4">
        {/* Google siempre visible aquí: quien llega directo a /entrar?m=signup
            o ?m=login (link del riel, top bar móvil, o compartido) no tiene
            forma de volver a la pantalla «elige método» — así que ambas
            entradas la traen de una vez. */}
        {googleButton()}
        <div className="flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-line" />
          <span className="font-sans text-[12px] text-text-2">{t("onb.or")}</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <form
          onSubmit={isLogin ? onLogin : onSignup}
          className="flex flex-col gap-3.5"
        >
          {emailPassFields()}
          {isLogin && (
            <p className="-mt-1 text-right font-sans text-[13px]">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setResetSent(false);
                  setAuthMode("forgot");
                }}
                className="font-medium text-text-2 transition-colors hover:text-grana-text"
              >
                {t("onb.forgot")}
              </button>
            </p>
          )}
          <Turnstile onToken={setCaptchaToken} resetRef={captchaReset} />
          {errText()}
          <button
            type="submit"
            disabled={submitting || (captchaEnabled && !captchaToken)}
            className={cn(
              granaBtn,
              (submitting || (captchaEnabled && !captchaToken)) && "opacity-60",
            )}
          >
            {t(isLogin ? "onb.login.submit" : "onb.signup.submit")}
          </button>
          <p className="mt-1 font-sans text-[13px] text-text-2">
            {isLogin ? t("onb.noAccount") : t("onb.haveAccount")}{" "}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setAuthMode(isLogin ? "signup" : "login");
              }}
              className="font-semibold text-grana-text"
            >
              {isLogin ? t("onb.createOne") : t("onb.login")}
            </button>
          </p>
        </form>
      </div>
    );
  };

  const googleButton = (dark = false) => (
    <button
      type="button"
      onClick={onGoogle}
      className={cn(
        "flex items-center justify-center gap-2.5 rounded-pill py-3.5 font-sans text-[15px] font-semibold transition-transform duration-150 ease-flow active:scale-[.98]",
        "bg-white text-tinta",
        !dark && "border border-line-2",
      )}
    >
      <GoogleIcon />
      {t("auth.google")}
    </button>
  );

  /** Botones «elige método» en superficie clara (desktop). */
  const chooseLight = () => (
    <>
      <div className="flex max-w-[380px] flex-col gap-3">
        {googleButton()}
        <button
          type="button"
          onClick={() => {
            play("click");
            setAuthMode("signup");
          }}
          className={granaBtn}
        >
          <Mail size={17} strokeWidth={1.9} />
          {t("auth.email")}
        </button>
      </div>
      <p className="mt-5 font-sans text-[13px] text-text-2">
        {t("onb.haveAccount")}{" "}
        <button
          type="button"
          onClick={() => {
            play("click");
            setAuthMode("login");
          }}
          className="font-semibold text-grana-text"
        >
          {t("onb.login")}
        </button>
      </p>
      <p className="mt-4 max-w-[40ch] font-sans text-[11px] leading-relaxed text-text-2">
        {t("onb.legal.pre")}{" "}
        <button
          type="button"
          onClick={() => openLegal("terminos")}
          className="font-semibold underline underline-offset-2 hover:text-ink"
        >
          {t("legal.terms")}
        </button>{" "}
        {t("onb.legal.mid")}{" "}
        <button
          type="button"
          onClick={() => openLegal("privacidad")}
          className="font-semibold underline underline-offset-2 hover:text-ink"
        >
          {t("onb.legal.privacyLink")}
        </button>
        {t("onb.legal.post")}
      </p>
    </>
  );

  // ── Contenido por paso (themes/profile/ready — compartido desktop/móvil) ────

  const themesBody = () => (
    <div className="flex flex-col p-10 max-lg:min-h-dvh max-lg:p-6 max-lg:pt-14">
      <BackButton to="auth" onGo={() => goStep("auth")} label={t("common.back")} />
      <div className="mb-1.5 flex items-end justify-between gap-4">
        <h2 className="font-serif text-[28px] font-medium leading-[1.1] max-lg:text-[25px]">
          {t("onb.themes.title")}
        </h2>
        <span className="whitespace-nowrap font-mono text-[14px] text-grana">
          <b>{selected.length}</b> / 3
        </span>
      </div>
      <p className="mb-5 font-sans text-[14px] text-text-2">
        {t("onb.themes.subtitle")}
      </p>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {tags.map((tag) => {
          const on = selected.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              aria-pressed={on}
              className={cn(
                "flex items-center gap-2.5 rounded-[12px] border px-3 py-3 text-left transition-colors duration-150 ease-flow",
                on
                  ? "border-grana bg-grana-wash"
                  : "border-line-2 bg-surface hover:border-ink",
                shakeId === tag.id && "[animation:fp-shake_.28s_ease]",
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 flex-none place-items-center rounded-pill border-[1.5px]",
                  on ? "border-grana bg-grana text-white" : "border-line-2",
                )}
              >
                {on && <Check size={12} strokeWidth={3.4} />}
              </span>
              <span className="font-serif text-[16px] text-ink">
                {tagName(tag, lang)}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={selected.length !== 3}
        onClick={() => goStep("profile")}
        className={cn(
          granaBtn,
          "mt-6 self-start max-lg:mt-8 max-lg:w-full",
          selected.length !== 3 && "pointer-events-none opacity-40",
        )}
      >
        {t("onb.continue")}
        <ArrowRight size={16} />
      </button>
    </div>
  );

  const profileBody = () => (
    <form
      onSubmit={onCreatePub}
      className="flex flex-col p-10 max-lg:min-h-dvh max-lg:p-6 max-lg:pt-14"
    >
      <BackButton to="themes" onGo={() => goStep("themes")} label={t("common.back")} />
      <h2 className="mb-1.5 font-serif text-[28px] font-medium leading-[1.1] max-lg:text-[25px]">
        {t("onb.profile.title")}
      </h2>
      <p className="mb-6 font-sans text-[14px] text-text-2">
        {t("onb.profile.subtitle")}
      </p>

      <div className="mb-6 flex items-center gap-[18px] max-lg:justify-center">
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onPickAvatar(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={avatarUploading}
          aria-label={t(avatarUrl ? "avatar.change" : "avatar.pick")}
          className={cn(
            "relative grid h-[86px] w-[86px] flex-none place-items-center overflow-hidden rounded-pill transition-opacity",
            avatarUrl
              ? "bg-ink"
              : displayName.trim()
                ? "bg-ink"
                : "border-2 border-dashed border-line-2 bg-surface-2 text-text-3 hover:border-ink",
            avatarUploading && "opacity-60",
          )}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : displayName.trim() ? (
            <span className="font-serif text-[34px] italic text-ink-on">
              {displayName.trim()[0]?.toUpperCase()}
            </span>
          ) : (
            <Camera size={26} strokeWidth={1.7} />
          )}
          {/* Insignia de cámara: siempre visible, invita a cambiarla aunque
              ya haya foto (p. ej. la que trajo Google). */}
          <span
            aria-hidden
            className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-pill border-2 border-surface bg-grana text-white"
          >
            <Camera size={11} strokeWidth={2.2} />
          </span>
        </button>
        <div className="font-sans text-[13px] leading-snug text-text-2 max-lg:hidden">
          {t(avatarUrl ? "avatar.change" : "onb.profile.photo")}
          {!avatarUrl && (
            <>
              <br />({t("onb.profile.optional")})
            </>
          )}
        </div>
      </div>
      {pickedAvatarFile && (
        <ImageCropper
          file={pickedAvatarFile}
          round
          title={t("avatar.crop.title")}
          hint={t("avatar.crop.hint")}
          confirmLabel={t("avatar.crop.confirm")}
          onClose={() => setPickedAvatarFile(null)}
          onCropped={(blob) => void onCroppedAvatar(blob)}
        />
      )}

      <div className="flex max-w-[420px] flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block font-sans text-[13px] font-semibold text-text-2">
            {t("onb.profile.name")}
          </span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("onb.profile.namePlaceholder")}
            className={inputCls}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-sans text-[13px] font-semibold text-text-2">
            {t("onb.profile.username")}
          </span>
          <span className="flex items-center overflow-hidden rounded-md border border-line-2 bg-surface focus-within:border-grana">
            <span className="py-3 pl-3.5 pr-1 font-sans text-[15px] text-text-2">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("onb.profile.usernamePlaceholder")}
              autoCapitalize="none"
              autoComplete="off"
              className="flex-1 border-none bg-transparent py-3 pl-0.5 pr-3.5 font-sans text-[15px] text-ink outline-none placeholder:text-text-3"
            />
          </span>
          <span className="mt-1.5 block font-sans text-[12px]">
            {avail === "free" && usernameNorm.length >= 3 ? (
              <span className="font-semibold text-ok">
                {t("onb.profile.usernameAvailable", { u: usernameNorm })}
              </span>
            ) : avail === "taken" ? (
              <span className="font-semibold text-grana-text">
                {t("onb.err.usernameTaken")}
              </span>
            ) : usernameNorm.length > 0 && usernameNorm.length < 3 ? (
              <span className="text-text-2">{t("onb.profile.usernameMin")}</span>
            ) : (
              <span className="text-text-2">{t("onb.profile.usernameHint")}</span>
            )}
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block font-sans text-[13px] font-semibold text-text-2">
            {t("onb.profile.bio")}{" "}
            <span className="font-normal text-text-2">· {t("onb.profile.optional")}</span>
          </span>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("onb.profile.bioPlaceholder")}
            className={cn(inputCls, "resize-none font-serif text-[16px]")}
          />
        </label>
      </div>

      {errText()}

      <button
        type="submit"
        disabled={submitting}
        className={cn(granaBtn, "mt-6 self-start max-lg:mt-8 max-lg:w-full", submitting && "opacity-60")}
      >
        {t("onb.profile.submit")}
        <ArrowRight size={16} />
      </button>
    </form>
  );

  const readyBody = () => {
    const chosen = tags.filter((tg) => selected.includes(tg.id));
    const first = displayName.trim().split(" ")[0];
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 p-12 text-center max-lg:min-h-dvh max-lg:p-8">
        <span className="fp-breathe mb-2 inline-block leading-[0] [transform-origin:50%_50%]">
          <svg width="64" height="64" viewBox="0 0 200 200" aria-hidden>
            <path
              d="M 96 176 C 140 172 176 140 176 100 C 176 56 140 24 100 24 C 60 24 26 56 26 100 C 26 138 56 166 96 156 C 130 148 150 124 150 100 C 150 76 130 60 108 64 C 92 67 86 80 92 92"
              fill="none"
              stroke="var(--grana)"
              strokeWidth={12}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h2 className="font-serif text-[30px] font-medium leading-[1.12] max-lg:text-[27px]">
          {first
            ? t("onb.ready.titleNamed", { name: first })
            : t("onb.ready.title")}
        </h2>
        <p className="mb-4 mt-2 max-w-[34ch] font-sans text-[14px] text-text-2">
          {t("onb.ready.subtitle")}
        </p>
        <div className="mb-7 flex flex-wrap justify-center gap-2">
          {(chosen.length ? chosen : tags.slice(0, 3)).map((tg) => (
            <span
              key={tg.id}
              className="rounded-pill bg-grana-wash px-3.5 py-1.5 font-sans text-[13px] font-semibold text-grana-700"
            >
              {tagName(tg, lang)}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3 max-lg:w-full max-lg:flex-col">
          <button
            type="button"
            onClick={() => {
              play("pop");
              router.push("/");
            }}
            className={granaBtn}
          >
            {t("onb.ready.enter")}
          </button>
          <button
            type="button"
            onClick={() => {
              play("rec");
              router.push("/componer");
            }}
            className="flex items-center justify-center gap-2.5 rounded-pill border border-line-2 bg-transparent px-6 py-3.5 font-sans text-[15px] font-semibold text-ink transition-transform duration-150 ease-flow active:scale-[.98]"
          >
            <Mic size={16} strokeWidth={1.9} />
            {t("onb.ready.record")}
          </button>
        </div>
      </div>
    );
  };

  const stepBody = () =>
    step === "themes"
      ? themesBody()
      : step === "profile"
        ? profileBody()
        : readyBody();

  // Encabezado del panel de auth según el modo. Eyebrow grana (kicker) en los
  // tres modos: da jerarquía y un toque de marca sin peso extra.
  const authHeader = () => {
    const login = authMode === "login";
    const forgot = authMode === "forgot";
    const eyebrow = forgot
      ? "onb.forgot.eyebrow"
      : login
        ? "onb.login.eyebrow"
        : "onb.eyebrow";
    return (
      <>
        <p className="mb-3 flex items-center gap-2 font-sans text-[12px] font-semibold uppercase tracking-[.14em] text-grana-text">
          <span aria-hidden className="h-[2px] w-6 rounded-pill bg-grana" />
          {t(eyebrow)}
        </p>
        <h2 className="mb-2.5 font-serif text-[32px] font-medium leading-[1.1] tracking-[-0.01em]">
          {t(forgot ? "onb.forgot.title" : login ? "onb.login.title" : "onb.auth.title")}
        </h2>
        <p className="mb-7 max-w-[42ch] font-sans text-[14px] leading-relaxed text-text-2">
          {t(forgot ? "onb.forgot.subtitle" : login ? "onb.login.subtitle" : "onb.auth.subtitle")}
        </p>
      </>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-dvh w-full font-sans text-ink">
      {/* DESKTOP · ventana con panel hipnótico a la izquierda */}
      <div className="hidden min-h-dvh place-items-center p-8 lg:grid">
        <div className="flex h-[680px] w-[1080px] max-w-full overflow-hidden rounded-[18px] border border-line bg-surface shadow-[var(--shadow-window)]">
          <BrandHypnotic className="flex w-[460px] flex-none flex-col items-center justify-center gap-[26px] p-12">
            <Link
              href="/"
              aria-label="FlowPub"
              className="rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-grana"
            >
              <BrandLockup />
            </Link>
          </BrandHypnotic>
          <div className="relative flex-1 overflow-y-auto">
            {step === "auth" ? (
              <div className="flex min-h-full flex-col justify-center px-14 py-12">
                {/* Bloque centrado en el panel: sin el vacío a la derecha. */}
                <div className="mx-auto w-full max-w-[400px]">
                  {authHeader()}
                  {authMode === "choose" ? chooseLight() : authFormLight()}
                  <p className="mt-8">{creditFoot()}</p>
                </div>
              </div>
            ) : (
              stepBody()
            )}
          </div>
        </div>
      </div>

      {/* MÓVIL · welcome hipnótico + hoja glass; pasos a pantalla completa */}
      <div className="min-h-dvh lg:hidden">
        {step === "auth" ? (
          authMode === "choose" ? (
            <BrandHypnotic className="flex min-h-dvh flex-col justify-end">
              <div className="absolute inset-x-0 top-0 flex h-[54%] flex-col items-center justify-center gap-[18px] p-8 text-center">
                <Link
                  href="/"
                  aria-label="FlowPub"
                  className="rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-grana"
                >
                  <BrandLockup markSize={70} />
                </Link>
              </div>
              <div
                className="relative m-3.5 mb-6 rounded-[28px] border p-6"
                style={{
                  background: "color-mix(in srgb, var(--amate) 10%, transparent)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  borderColor: "color-mix(in srgb, var(--amate) 18%, transparent)",
                }}
              >
                <p
                  className="mb-4 text-center font-sans text-[13px]"
                  style={{ color: "color-mix(in srgb, var(--amate) 70%, transparent)" }}
                >
                  {t("onb.auth.sheet")}
                </p>
                <div className="flex flex-col gap-3">
                  {googleButton(true)}
                  <button
                    type="button"
                    onClick={() => {
                      play("click");
                      setAuthMode("signup");
                    }}
                    className="flex items-center justify-center gap-2.5 rounded-pill border py-3.5 font-sans text-[15px] font-semibold transition-transform duration-150 ease-flow active:scale-[.98]"
                    style={{
                      color: "var(--amate)",
                      borderColor: "color-mix(in srgb, var(--amate) 30%, transparent)",
                    }}
                  >
                    {t("auth.email")}
                  </button>
                </div>
                <p
                  className="mt-3.5 text-center font-sans text-[12px]"
                  style={{ color: "color-mix(in srgb, var(--amate) 60%, transparent)" }}
                >
                  {t("onb.haveAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      play("click");
                      setAuthMode("login");
                    }}
                    className="font-semibold"
                    style={{ color: "#EC9DA2" }}
                  >
                    {t("onb.login")}
                  </button>
                </p>
                <p className="mt-4 text-center">{creditFoot(true)}</p>
              </div>
            </BrandHypnotic>
          ) : (
            <div className="flex min-h-dvh flex-col bg-surface p-6 pt-14">
              <BackButton
                to="auth"
                onGo={() => {
                  setError(null);
                  setCheckEmail(false);
                  setAuthMode("choose");
                }}
                label={t("common.back")}
              />
              {/* Bloque centrado + marca viva: el móvil no tiene el panel
                  hipnótico, así que la vírgula le da presencia de marca. */}
              <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center">
                <Link
                  href="/"
                  aria-label="FlowPub"
                  className="mb-6 w-fit rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-grana"
                >
                  <FlowMark size={36} className="text-ink" />
                </Link>
                {authHeader()}
                {authFormLight()}
                <p className="mt-8">{creditFoot()}</p>
              </div>
            </div>
          )
        ) : (
          <div className="min-h-dvh bg-surface">{stepBody()}</div>
        )}
      </div>
    </div>
  );
}

function BackButton({
  onGo,
  label,
}: {
  to: Step;
  onGo: () => void;
  label: string;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onGo}
      className="mb-4 flex items-center gap-1.5 self-start font-sans text-[13px] font-semibold text-text-2 transition-colors hover:text-ink"
    >
      <ChevronLeft size={16} />
      {label}
    </button>
  );
}
