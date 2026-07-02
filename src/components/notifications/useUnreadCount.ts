"use client";

import { useEffect, useState } from "react";
import { fetchUnreadNotifCount } from "@/data/notificationsClient";
import { useAuth } from "@/providers/AuthProvider";

/** Conteo de notificaciones sin leer, para el punto en la campana. Sin
 *  Realtime todavía (milestone 7): un fetch al montar basta — el chrome
 *  remonta en cada navegación, así que se refresca solo. */
export function useUnreadCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    let alive = true;
    fetchUnreadNotifCount().then((n) => {
      if (alive) setCount(n);
    });
    return () => {
      alive = false;
    };
  }, [user]);

  return count;
}
