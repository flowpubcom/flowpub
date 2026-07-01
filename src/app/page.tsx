import { AppShell } from "@/components/shell/AppShell";
import { PubFeed } from "@/components/feed/PubFeed";
import { PubRightRail } from "@/components/feed/PubRightRail";
import { fetchFlows } from "@/data/flowsApi";

// El Pub — el timeline de las voces. Público: cualquiera navega sin cuenta.
export default async function Home() {
  const flows = await fetchFlows();
  return (
    <AppShell active="pub" rightRail={<PubRightRail />}>
      <PubFeed flows={flows} />
    </AppShell>
  );
}
