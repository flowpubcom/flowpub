import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { ExploreView } from "@/components/explore/ExploreView";
import { fetchTagsWithCounts, fetchVoices, searchFlows } from "@/data/exploreApi";
import { RSS_ALT } from "@/lib/seo";
import type { Flow } from "@/data/types";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const searching = !!(q ?? "").trim();
  return {
    title: "Explorar — temas y voces del Pub",
    description:
      "Descubre voces y Flows: busca por palabra, pasea por los doce temas del Pub y encuentra a quién seguir en FlowPub.",
    // El estado de búsqueda (?q=) es utilitario y casi-duplicado: fuera del
    // índice, pero seguimos sus enlaces a Flows y perfiles. NO ponemos canonical
    // a «/explorar» ahí: noindex + canonical a otra URL son señales en conflicto;
    // dejamos que se auto-canonicalice (ya está noindex). La base sí se canoniza.
    ...(searching
      ? { robots: { index: false, follow: true }, alternates: { types: RSS_ALT } }
      : { alternates: { canonical: "/explorar", types: RSS_ALT } }),
  };
}

// Explorar es público (como el Pub): cualquiera busca y pasea sin cuenta.
export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: raw } = await searchParams;
  const q = (raw ?? "").trim().slice(0, 80);

  const [topics, voices, flows] = await Promise.all([
    fetchTagsWithCounts(),
    fetchVoices(q || undefined),
    q ? searchFlows(q) : Promise.resolve([] as Flow[]),
  ]);

  return (
    <AppShell active="explore">
      <ExploreView q={q} topics={topics} voices={voices} flows={flows} />
    </AppShell>
  );
}
