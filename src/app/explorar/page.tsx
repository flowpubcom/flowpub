import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { ExploreView } from "@/components/explore/ExploreView";
import { fetchTagsWithCounts, fetchVoices, searchFlows } from "@/data/exploreApi";
import type { Flow } from "@/data/types";

export const metadata: Metadata = {
  title: "Explorar — temas y voces del Pub",
  description:
    "Descubre voces y Flows: busca por palabra, pasea por los doce temas del Pub y encuentra a quién seguir en FlowPub.",
  alternates: { canonical: "/explorar" },
};

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
