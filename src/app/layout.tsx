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

export const metadata: Metadata = {
  title: { default: "FlowPub", template: "%s · FlowPub" },
  description: "La voz que se vuelve publicación.",
  applicationName: "FlowPub",
  metadataBase: new URL("https://flowpub.lat"),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#141110" },
  ],
};

// Pinta el tema ANTES del primer frame (sin FOUC). Lee fp-theme / SO.
const themeScript = `(function(){try{var t=localStorage.getItem('fp-theme');var d=t==='dark'||((t===null||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;if(d){e.setAttribute('data-theme','dark');}else{e.removeAttribute('data-theme');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* No-flash: pinta el tema antes del primer frame. Corre en el HTML del
            SSR (síncrono, pre-paint). El warning de React por <script> es solo
            de dev y se elimina en producción. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${fraunces.variable} ${hanken.variable} ${spaceMono.variable}`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
