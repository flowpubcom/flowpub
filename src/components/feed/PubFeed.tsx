"use client";

import { useMemo, useState } from "react";
import { TagFilter } from "./TagFilter";
import { FlowCard } from "./FlowCard";
import { RadioProvider } from "@/providers/RadioProvider";
import { useI18n } from "@/providers/I18nProvider";
import { useAuth } from "@/providers/AuthProvider";
import type { Flow } from "@/data/types";
import type { TagRow } from "@/data/tags";

/** Columna central de El Pub: filtros (tema + duración) + lista de Flows. */
export function PubFeed({ flows, tags }: { flows: Flow[]; tags: TagRow[] }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [activeTag, setActiveTag] = useState("all");
  const [maxDuration, setMaxDuration] = useState<number | null>(null);

  const shown = useMemo(
    () =>
      flows.filter(
        (f) =>
          (activeTag === "all" || f.tagSlug === activeTag) &&
          (maxDuration === null || f.durationSeconds <= maxDuration),
      ),
    [flows, activeTag, maxDuration],
  );

  // La radio encadena solo Flows con audio real, en el orden visible del feed.
  // Los 18+ se saltan si quien escucha no confirmó mayoría de edad.
  const radioOrder = useMemo(
    () =>
      shown
        .filter((f) => f.audioUrl)
        .filter((f) => !f.adult || f.author.id === user?.id || (user?.isAdult ?? false))
        .map((f) => f.id),
    [shown, user],
  );

  return (
    <RadioProvider order={radioOrder}>
      <TagFilter
        tags={tags}
        active={activeTag}
        onChange={setActiveTag}
        duration={maxDuration}
        onDurationChange={setMaxDuration}
      />
      <div className="mx-auto flex max-w-[640px] flex-col gap-5 px-4 py-5 lg:px-7">
        {shown.map((flow) => (
          <FlowCard key={flow.id} flow={flow} />
        ))}
        {shown.length === 0 && (
          <p className="py-16 text-center font-sans text-[14px] text-text-3">
            {t("pub.empty")}
          </p>
        )}
      </div>
    </RadioProvider>
  );
}
