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

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flowpub.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "FlowPub | Speak, Flow, Publish",
    template: "%s · FlowPub",
  },
  description:
    "Transforma tu voz en publicaciones completas con IA. Graba hasta 3 minutos, obtén transcripción automática, edición e imágenes generativas al instante.",
  applicationName: "FlowPub",
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
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

// Anti-FOUC de tema: el default del SO lo resuelve `@media
// (prefers-color-scheme)` en globals.css, pero un override explícito guardado
// en localStorage('fp-theme') solo lo aplicaba el ThemeProvider al hidratar —
// flash garantizado para quien forzó el tema contrario a su SO. Este script
// corre antes del primer pintado y adelanta el data-theme SOLO si hay valor
// explícito; con «system» no toca nada y el @media sigue mandando.
const THEME_INIT = `try{var t=localStorage.getItem("fp-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // <html lang>: se queda "es" en SSR a propósito. Leer Accept-Language con
  // headers() aquí vuelve dinámico TODO el árbol (verificado con `next build`:
  // /splash, /deck, /entrar… pasan de ○ prerendered a ƒ on-demand), y perder
  // el prerender de las páginas públicas cuesta más que el lang provisional.
  // El I18nProvider corrige document.documentElement.lang al hidratar
  // (localStorage('fp-lang') / navigator.language).
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body
        className={`${fraunces.variable} ${hanken.variable} ${spaceMono.variable}`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
