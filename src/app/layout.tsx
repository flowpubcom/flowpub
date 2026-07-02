import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, Space_Mono } from "next/font/google";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

// Fraunces = la voz · Hanken Grotesk = el chrome · Space Mono = los datos.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flowpub.lat";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "FlowPub | Speak, Flow, Publish",
    template: "%s · FlowPub",
  },
  description:
    "Transforma tu voz en publicaciones completas con IA. Graba hasta 9 minutos, obtén transcripción automática, edición e imágenes generativas al instante.",
  applicationName: "FlowPub",
  openGraph: {
    type: "website",
    siteName: "FlowPub",
    locale: "es_MX",
    alternateLocale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#141110" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // No-flash sin script: el default del SO lo resuelve `@media
  // (prefers-color-scheme)` en globals.css; el override explícito lo aplica el
  // ThemeProvider vía data-theme. Sin <script> = consola limpia.
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${hanken.variable} ${spaceMono.variable}`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
