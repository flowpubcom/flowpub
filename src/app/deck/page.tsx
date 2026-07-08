import type { Metadata } from "next";
import { Deck } from "@/components/deck/Deck";

// Pitch deck ejecutivo (/deck): presentación interactiva para conseguir recursos.
// No indexable (activo de fundraising que se comparte por enlace).
export const metadata: Metadata = {
  title: "FlowPub — Pitch",
  description:
    "La voz que se vuelve publicación. Presentación ejecutiva de FlowPub: qué es, cómo funciona, y un año de vida para que crezca.",
  robots: { index: false, follow: false },
};

export default function DeckPage() {
  return <Deck />;
}
