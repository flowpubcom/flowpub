"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

/** /restablecer: el enlace del correo de recuperación aterriza aquí con
 *  sesión viva (la intercambió /auth/callback); solo falta la contraseña. */
export function ResetPassword() {
  const { t } = useI18n();
  const { play } = useSound();
  const { refresh } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError(t("onb.err.weakPassword"));
      play("soft");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) {
      setError(t("onb.err.generic"));
      play("soft");
      return;
    }
    play("pop");
    await refresh();
    setDone(true);
  };

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-[420px] rounded-[20px] border border-line bg-surface p-8 shadow-[var(--shadow-window)]">
        <div className="flex justify-center">
          <Logo markSize={28} textSize={22} />
        </div>

        {done ? (
          <div className="mt-7 text-center">
            <h1 className="font-serif text-[26px] font-medium leading-[1.15] text-ink">
              {t("reset.done")}
            </h1>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-pill bg-grana px-8 font-sans text-[15px] font-semibold text-white shadow-[var(--shadow-grana)] transition-transform duration-150 ease-flow active:scale-[.97]"
            >
              {t("reset.enter")}
            </button>
          </div>
        ) : (
          <>
            <h1 className="mt-7 font-serif text-[26px] font-medium leading-[1.15] text-ink">
              {t("reset.title")}
            </h1>
            <p className="mt-2 font-sans text-[14px] text-text-2">
              {t("reset.subtitle")}
            </p>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <label className="block">
                <span className="mb-1.5 block font-sans text-[13px] font-semibold text-text-2">
                  {t("onb.password.label")}
                </span>
                <span className="relative block">
                  <input
                    type={show ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("onb.password.placeholder")}
                    className="w-full rounded-md border border-line-2 bg-surface px-3.5 py-3 pr-11 font-sans text-[15px] text-ink outline-none transition-colors placeholder:text-text-3 focus-visible:border-grana"
                  />
                  <button
                    type="button"
                    // preventDefault en el down: no roba el foco → el teclado
                    // móvil sigue abierto mientras alternas el ojo.
                    onPointerDown={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      play("tick");
                      setShow((v) => !v);
                    }}
                    aria-pressed={show}
                    aria-label={t(show ? "onb.password.hide" : "onb.password.show")}
                    className="absolute right-[3px] top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-pill text-text-3 transition-colors hover:text-ink"
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              {error && (
                <p role="status" className="font-sans text-[13px] text-grana-text">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving || password.length === 0}
                className={cn(
                  "flex h-12 items-center justify-center rounded-pill bg-grana font-sans text-[15px] font-semibold text-white shadow-[var(--shadow-grana)] transition-transform duration-150 ease-flow active:scale-[.98]",
                  (saving || password.length === 0) && "opacity-60",
                )}
              >
                {t("reset.submit")}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
