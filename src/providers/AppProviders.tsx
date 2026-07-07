"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { I18nProvider } from "./I18nProvider";
import { SoundProvider } from "./SoundProvider";
import { AuthProvider } from "./AuthProvider";
import { LegalProvider } from "./LegalProvider";
import { VersionWatcher } from "@/components/shell/VersionWatcher";
import { InstallPrompt } from "@/components/shell/InstallPrompt";

/**
 * Raíz de providers de cliente + vigías globales (versión nueva, instalar
 * PWA): van aquí y no en AppShell para cubrir también /flow y /entrar.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SoundProvider>
          <AuthProvider>
            <LegalProvider>
              {children}
              <VersionWatcher />
              <InstallPrompt />
            </LegalProvider>
          </AuthProvider>
        </SoundProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
