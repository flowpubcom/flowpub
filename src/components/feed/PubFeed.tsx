"use client";

import { useMemo, useState } from "react";
import { TagFilter } from "./TagFilter";
import { FlowCard } from "./FlowCard";
import { FLOWS } from "@/data/mock";

/** Columna central de El Pub: filtro de tags + lista de Flows. */
export function PubFeed() {
  const [active, setActive] = useState("Todos");
  const flows = useMemo(
    () => (active === "Todos" ? FLOWS : FLOWS.filter((f) => f.tag === active)),
    [active],
  );

  return (
    <>
      <TagFilter active={active} onChange={setActive} />
      <div className="mx-auto flex max-w-[640px] flex-col gap-5 px-4 py-5 lg:px-7">
        {flows.map((flow) => (
          <FlowCard key={flow.id} flow={flow} />
        ))}
        {flows.length === 0 && (
          <p className="py-16 text-center font-sans text-[14px] text-text-3">
            Aún no hay Flows en este tema. Sé la primera voz.
          </p>
        )}
      </div>
    </>
  );
}
