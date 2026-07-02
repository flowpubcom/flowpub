import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { PubFeed } from "@/components/feed/PubFeed";
import { PubRightRail } from "@/components/feed/PubRightRail";
import { fetchFlows } from "@/data/flowsApi";
import { fetchTags } from "@/data/tagsApi";
import { fetchSuggested, fetchTrending } from "@/data/railApi";

// El <title>/description son del feed (SEO). El share social (OG/Twitter) usa
// la marca: es la tarjeta que Julio definió para WhatsApp y redes.
const SHARE_TITLE = "FlowPub | Speak, Flow, Publish";
const SHARE_DESC =
  "Transforma tu voz en publicaciones completas con IA. Graba hasta 3 minutos, obtén transcripción automática, edición e imágenes generativas al instante.";

export const metadata: Metadata = {
  title: "El Pub — voces que se vuelven publicación",
  description:
    "Escucha y lee Flows: publicaciones que nacen de la voz. Arte, ciencia, libros, cultura, viajes y más — transcritas y pulidas con IA, siempre con su audio original.",
  alternates: { canonical: "/" },
  openGraph: { title: SHARE_TITLE, description: SHARE_DESC },
  twitter: { card: "summary_large_image", title: SHARE_TITLE, description: SHARE_DESC },
};

// El Pub — el timeline de las voces. Público: cualquiera navega sin cuenta.
export default async function Home() {
  const [flows, tags, trending, suggested] = await Promise.all([
    fetchFlows(),
    fetchTags(),
    fetchTrending(),
    fetchSuggested(),
  ]);
  return (
    <AppShell
      active="pub"
      rightRail={<PubRightRail trending={trending} suggested={suggested} />}
    >
      <PubFeed flows={flows} tags={tags} />
    </AppShell>
  );
}
