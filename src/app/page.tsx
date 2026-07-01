import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { PubFeed } from "@/components/feed/PubFeed";
import { PubRightRail } from "@/components/feed/PubRightRail";
import { fetchFlows } from "@/data/flowsApi";
import { fetchTags } from "@/data/tagsApi";

export const metadata: Metadata = {
  title: "El Pub — voces que se vuelven publicación",
  description:
    "Escucha y lee Flows: publicaciones que nacen de la voz. Arte, ciencia, libros, cultura, viajes y más — transcritas y pulidas con IA, siempre con su audio original.",
  alternates: { canonical: "/" },
};

// El Pub — el timeline de las voces. Público: cualquiera navega sin cuenta.
export default async function Home() {
  const [flows, tags] = await Promise.all([fetchFlows(), fetchTags()]);
  return (
    <AppShell active="pub" rightRail={<PubRightRail />}>
      <PubFeed flows={flows} tags={tags} />
    </AppShell>
  );
}
