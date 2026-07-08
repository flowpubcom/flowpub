"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui";
import { FollowButton } from "@/components/social/FollowButton";
import { compactNumber } from "@/lib/format";
import type { TrendingTag } from "@/data/types";
import type { SuggestedVoice } from "@/data/railApi";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-2">
      {children}
    </h2>
  );
}

export function PubRightRail({
  trending = [],
  suggested = [],
}: {
  trending?: TrendingTag[];
  suggested?: SuggestedVoice[];
}) {
  return (
    <div className="flex flex-col gap-8">
      {trending.length > 0 && (
        <section>
          <Eyebrow>Hoy en el Pub</Eyebrow>
          <ul className="flex flex-col gap-3">
            {trending.map((tag) => (
              <li key={tag.slug}>
                <Link
                  href={`/tema/${tag.slug}`}
                  className="flex items-baseline justify-between rounded-[8px] transition-colors hover-tint"
                >
                  <span className="font-serif text-[17px] text-ink">
                    {tag.name}
                  </span>
                  <span className="font-mono text-[12px] text-text-2">
                    {compactNumber(tag.flows)} flows
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {suggested.length > 0 && (
        <section>
          <Eyebrow>Voces para seguir</Eyebrow>
          <ul className="flex flex-col gap-4">
            {suggested.map(({ profile, topics, following }) => (
              <li
                key={profile.id}
                className="flex items-center justify-between gap-3"
              >
                <Link
                  href={`/@${profile.username}`}
                  className="flex min-w-0 items-center gap-2.5"
                >
                  <Avatar
                    name={profile.displayName}
                    src={profile.avatarUrl}
                    color={profile.avatarColor}
                    size={38}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[14px] font-semibold text-ink">
                      {profile.displayName}
                    </p>
                    <p className="truncate font-sans text-[12px] text-text-2">
                      {topics || `@${profile.username}`}
                    </p>
                  </div>
                </Link>
                <FollowButton followeeId={profile.id} initial={following} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
