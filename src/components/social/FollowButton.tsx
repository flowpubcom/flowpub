"use client";

import { useState } from "react";
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

  const toggle = async () => {
    if (!user) {
      play("soft");
      router.push("/entrar");
      return;
    }
    const n = !following;
    setFollowing(n);
    play(n ? "pop" : "soft");
    const res = await setFollow(followeeId, n);
    if (!res.ok) setFollowing(!n);
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
