import Link from "next/link";
import { fetchFlowsByTag } from "@/data/flowsApi";
import { fetchFlowsByAuthor } from "@/data/profilesApi";
import type { Flow } from "@/data/types";

// Malla de enlaces internos (Server Component → los <a> viven en el HTML del
// servidor, así el rastreador los sigue): «más del autor» y «más del tema».
// Refuerza el rastreo, la autoridad temática y el descubrimiento humano.
// Copy en español fijo, como el resto del chrome server-rendered (hub de tema).

function pickOthers(flows: Flow[], excludeId: string, max = 4): Flow[] {
  const seen = new Set<string>();
  const out: Flow[] = [];
  for (const f of flows) {
    if (f.id === excludeId || f.status === "draft" || seen.has(f.id)) continue;
    seen.add(f.id);
    out.push(f);
    if (out.length >= max) break;
  }
  return out;
}

function FlowLinkList({ title, flows }: { title: string; flows: Flow[] }) {
  if (flows.length === 0) return null;
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-2">
        {title}
      </p>
      <ul className="flex flex-col gap-3">
        {flows.map((f) => (
          <li key={f.id}>
            <Link
              href={`/flow/${f.id}`}
              className="block font-serif text-[17px] leading-snug text-ink transition-colors hover:text-grana-text"
            >
              {f.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function RelatedFlows({ flow }: { flow: Flow }) {
  const [byAuthor, byTag] = await Promise.all([
    fetchFlowsByAuthor(flow.author.id),
    flow.tagSlug ? fetchFlowsByTag(flow.tagSlug) : Promise.resolve([] as Flow[]),
  ]);

  const authorFlows = pickOthers(byAuthor, flow.id);
  // En el tema, evita repetir los que ya salieron en «más del autor».
  const authorIds = new Set(authorFlows.map((f) => f.id));
  const tagFlows = pickOthers(
    byTag.filter((f) => !authorIds.has(f.id)),
    flow.id,
  );

  if (authorFlows.length === 0 && tagFlows.length === 0) return null;

  return (
    <section
      aria-label="Más para escuchar y leer"
      className="mx-auto max-w-[720px] border-t border-line px-5 py-10"
    >
      <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
        <FlowLinkList
          title={`Más de ${flow.author.displayName}`}
          flows={authorFlows}
        />
        {flow.tagSlug && tagFlows.length > 0 && (
          <FlowLinkList title={`Más en ${flow.tag}`} flows={tagFlows} />
        )}
      </div>
    </section>
  );
}
