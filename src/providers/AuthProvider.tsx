"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { AvatarColor } from "@/data/types";
import { createClient } from "@/lib/supabase/client";

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  avatarColor?: AvatarColor;
  avatarUrl?: string | null;
  /** ¿Ya completó el onboarding (3 temas + perfil)? */
  onboarded: boolean;
}

interface AuthCtx {
  user: SessionUser | null;
  loading: boolean;
  /** Re-lee sesión + perfil (p. ej. al terminar el onboarding). */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: false,
  refresh: async () => {},
  signOut: async () => {},
});

// Sin env (build/CI sin backend) el provider queda inerte: usuario null, sin crash.
const hasEnv =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Sesión real de Supabase. Cualquiera navega el Pub; grabar/publicar exige sesión.
 * Mapea auth.users + su fila en `profiles` a un SessionUser para el chrome.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => (hasEnv ? createClient() : null));
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(!!supabase);

  const applyUser = useCallback(
    async (authUser: User | null) => {
      if (!supabase || !authUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      // Cascada tolerante: si el esquema aún no tiene `onboarded`, cae a false.
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, onboarded")
        .eq("id", authUser.id)
        .maybeSingle();

      const fallbackName = authUser.email?.split("@")[0] ?? "voz";
      setUser({
        id: authUser.id,
        username: profile?.username ?? fallbackName,
        displayName:
          profile?.display_name || profile?.username || fallbackName,
        avatarUrl: profile?.avatar_url ?? null,
        onboarded: profile?.onboarded ?? false,
      });
      setLoading(false);
    },
    [supabase],
  );

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    await applyUser(authUser);
  }, [supabase, applyUser]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    void refresh();
    // No llames a otros métodos de auth dentro del callback (riesgo de deadlock):
    // usa el user de la sesión y solo consulta el perfil.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase, refresh, applyUser]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  return (
    <Ctx.Provider value={{ user, loading, refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
