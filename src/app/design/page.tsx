import type { Metadata } from "next";
import { BrandGuide } from "@/components/design/BrandGuide";
import { RSS_ALT } from "@/lib/seo";

// Manual de marca público (/design): identidad + guía de uso, bilingüe, con
// materiales descargables. Página independiente (fuera del chrome del Pub).
export const metadata: Metadata = {
  title: "Marca FlowPub — identidad y manual de uso",
  description:
    "La identidad de FlowPub: la vírgula, la paleta «tinta, grana y amate», la tipografía, el movimiento y el sonido. Manual de marca bilingüe (ES/EN) con materiales descargables.",
  alternates: { canonical: "/design", types: RSS_ALT },
  openGraph: {
    type: "website",
    title: "Marca FlowPub — identidad y manual de uso",
    description:
      "La vírgula, la paleta tinta/grana/amate, la tipografía, el movimiento y el sonido. Manual de marca con materiales descargables.",
    url: "/design",
  },
};

export default function DesignPage() {
  return <BrandGuide />;
}
