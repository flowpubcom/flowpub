import type { Metadata } from "next";
import { Welcome } from "@/components/welcome/Welcome";
import { RSS_ALT } from "@/lib/seo";

// Landing / splash pública (fuera del chrome del Pub): explica FlowPub a
// usuarios nuevos con una narrativa guiada por scroll y un fondo Three.js.
export const metadata: Metadata = {
  title: "FlowPub — la voz que se vuelve publicación",
  description:
    "Tocas grabar, hablas hasta tres minutos y FlowPub lo vuelve un artículo con su portada, sin perder tu voz. Un timeline de voces reales. Beta abierta en flowpub.app.",
  alternates: { canonical: "/splash", types: RSS_ALT },
  openGraph: {
    type: "website",
    title: "FlowPub — la voz que se vuelve publicación",
    description:
      "Graba tu voz, se vuelve publicación. Comentarios de voz, seguir, mensajes y más. Beta abierta.",
    url: "/splash",
  },
};

export default function SplashPage() {
  return <Welcome />;
}
