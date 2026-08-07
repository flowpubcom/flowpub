import type { Metadata } from "next";
import { Deck } from "@/components/deck/Deck";
import { LangOverride } from "@/providers/I18nProvider";

// Pitch deck ejecutivo (/deck): presentación interactiva para conseguir recursos.
// No indexable (activo de fundraising que se comparte por enlace).
export const metadata: Metadata = {
  title: "FlowPub — Pitch",
  description:
    "La voz que se vuelve publicación. Presentación ejecutiva de FlowPub: qué es, cómo funciona, y un año de vida para que crezca.",
  robots: { index: false, follow: false },
};

export default function DeckPage() {
  // LangOverride: el toggle de idioma del deck cambia SOLO esta página (es un
  // activo de fundraising que se enseña en ambos idiomas, no una preferencia).
  return (
    <LangOverride>
      <Deck />
    </LangOverride>
  );
}
