"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AvatarColor } from "@/data/types";

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  avatarColor?: AvatarColor;
  avatarUrl?: string | null;
}

interface AuthCtx {
  user: SessionUser | null;
  loading: boolean;
}

const Ctx = createContext<AuthCtx>({ user: null, loading: false });

/**
 * Sesión. Front-first: sin usuario por ahora (cualquiera navega el Pub; grabar
 * abre la compuerta). La auth real de Supabase entra en la fase de Auth.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <Ctx.Provider value={{ user: null, loading: false }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
