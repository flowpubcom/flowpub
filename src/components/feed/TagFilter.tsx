"use client";

import { Chip } from "@/components/ui";
import { TAGS } from "@/data/mock";

/** Fila sticky de chips. En móvil queda bajo la top bar; en desktop, al tope. */
export function TagFilter({
  active,
  onChange,
}: {
  active: string;
  onChange: (tag: string) => void;
}) {
  return (
    <div className="glass sticky top-[56px] z-10 border-b border-line-soft lg:top-0">
      <div className="flex gap-2 overflow-x-auto px-4 py-3.5 [scrollbar-width:none] lg:px-7 [&::-webkit-scrollbar]:hidden">
        {TAGS.map((tag) => (
          <Chip
            key={tag}
            active={active === tag}
            onClick={() => onChange(tag)}
            className="flex-none"
          >
            {tag}
          </Chip>
        ))}
      </div>
    </div>
  );
}
