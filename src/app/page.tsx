import { AppShell } from "@/components/shell/AppShell";
import { PubFeed } from "@/components/feed/PubFeed";
import { PubRightRail } from "@/components/feed/PubRightRail";

// El Pub — el timeline de las voces. Público: cualquiera navega sin cuenta.
export default function Home() {
  return (
    <AppShell active="pub" rightRail={<PubRightRail />}>
      <PubFeed />
    </AppShell>
  );
}
