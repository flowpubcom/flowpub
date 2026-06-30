"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { I18nProvider } from "./I18nProvider";
import { SoundProvider } from "./SoundProvider";
import { AuthProvider } from "./AuthProvider";

/**
 * Raíz de providers de cliente. Realtime entra en su fase.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SoundProvider>
          <AuthProvider>{children}</AuthProvider>
        </SoundProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
