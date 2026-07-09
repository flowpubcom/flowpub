"use client";

import { useEffect, useState } from "react";
import {
  NOTIF_READ_ALL_EVENT,
  NOTIF_READ_EVENT,
  fetchUnreadNotifCount,
} from "@/data/notificationsClient";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

/** Conteo de notificaciones sin leer, para el punto en la campana. Se hace un
 *  fetch al montar (el chrome remonta en cada navegación) y además se escucha
 *  el puente de eventos: al marcar leído en la bandeja, el punto se actualiza
 *  al instante sin esperar a navegar. Encima, una suscripción Realtime a los
 *  INSERT de `notifications` hace que el punto aparezca en vivo aunque el
 *  usuario esté quieto en una página. */
export function useUnreadCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    let alive = true;
    const refetch = () => {
      fetchUnreadNotifCount().then((n) => {
        if (alive) setCount(n);
      });
    };
    refetch();

    // Realtime: nueva notificación con el usuario quieto → el punto aparece sin
    // esperar a navegar. La RLS (user_id = auth.uid()) sigue mandando. Es no-op
    // hasta que la tabla entre a la publicación (migration_24).
    const supabase = createClient();
    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => setCount((c) => c + 1),
      )
      .subscribe();

    // Red de seguridad barata: al volver a la pestaña, reconcilia el conteo
    // (por si un INSERT se perdió mientras estaba en segundo plano).
    const onFocus = () => refetch();
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user]);

  useEffect(() => {
    const onOne = () => setCount((c) => Math.max(0, c - 1));
    const onAll = () => setCount(0);
    window.addEventListener(NOTIF_READ_EVENT, onOne);
    window.addEventListener(NOTIF_READ_ALL_EVENT, onAll);
    return () => {
      window.removeEventListener(NOTIF_READ_EVENT, onOne);
      window.removeEventListener(NOTIF_READ_ALL_EVENT, onAll);
    };
  }, []);

  return count;
}
