"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { I18nProvider } from "./I18nProvider";
import { SoundProvider } from "./SoundProvider";

/**
 * Raíz de providers de cliente. Aquí entrarán Auth y Realtime en sus fases.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SoundProvider>{children}</SoundProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
