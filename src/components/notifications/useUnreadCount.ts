"use client";

import { useEffect, useState } from "react";
import {
  NOTIF_READ_ALL_EVENT,
  NOTIF_READ_EVENT,
  fetchUnreadNotifCount,
} from "@/data/notificationsClient";
import { useAuth } from "@/providers/AuthProvider";

/** Conteo de notificaciones sin leer, para el punto en la campana. Se hace un
 *  fetch al montar (el chrome remonta en cada navegación) y además se escucha
 *  el puente de eventos: al marcar leído en la bandeja, el punto se actualiza
 *  al instante sin esperar a navegar. */
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
