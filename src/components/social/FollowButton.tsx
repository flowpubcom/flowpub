"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { useAuth } from "@/providers/AuthProvider";
import { setFollow } from "@/data/engagement";

/** Botón Seguir compacto (riel, Explorar, notificaciones). Optimista con
 *  revert; invitado → /entrar. */
export function FollowButton({
  followeeId,
  initial,
}: {
  followeeId: string;
  initial: boolean;
}) {
  const { t } = useI18n();
  const { play } = useSound();
  const { user } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(initial);
  // Candado in-flight: sin él, un doble tap dispara insert y delete en paralelo
  // y el que aterrice al último gana — la UI podía quedar en «Siguiendo» con la
  // fila borrada en la base.
  const pending = useRef(false);

  // Si el servidor manda un estado nuevo (p. ej. tras router.refresh()), gana él.
  useEffect(() => setFollowing(initial), [initial, followeeId]);

  const toggle = async () => {
    if (!user) {
      play("soft");
      router.push("/entrar");
      return;
    }
    if (pending.current) return;
    pending.current = true;
    const n = !following;
    setFollowing(n);
    play(n ? "pop" : "soft");
    try {
      const res = await setFollow(followeeId, n);
      if (!res.ok) {
        setFollowing(!n);
        return;
      }
      // Invalida el caché de rutas de Next. Sin esto, abrir el perfil de quien
      // acabas de seguir servía la copia previa (el segment cache tiene piso de
      // 30 s, y en back/forward el bfcache ignora la caducidad por diseño), así
      // que el perfil decía «Seguir» aunque la fila ya existiera.
      router.refresh();
    } finally {
      pending.current = false;
    }
  };

  return (
    <button
      type="button"
      aria-pressed={following}
      onClick={toggle}
      className={cn(
        "flex-none rounded-pill border px-3.5 py-1.5 font-sans text-[12px] font-semibold transition-colors duration-150 ease-flow",
        following
          ? "border-ink bg-ink text-ink-on"
          : "border-line-2 text-ink hover:bg-ink hover:text-ink-on",
      )}
    >
      {following ? t("following") : t("follow")}
    </button>
  );
}
