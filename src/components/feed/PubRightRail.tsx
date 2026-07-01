"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";
import { SUGGESTED, TRENDING } from "@/data/mock";
import { compactNumber } from "@/lib/format";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
      {children}
    </h2>
  );
}

function FollowButton() {
  const { t } = useI18n();
  const { play } = useSound();
  const [following, setFollowing] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={following}
      onClick={() => {
        const n = !following;
        setFollowing(n);
        play(n ? "pop" : "soft");
      }}
      className={cn(
        "flex-none rounded-pill border px-3.5 py-1.5 font-sans text-[12px] font-semibold transition-colors duration-150 ease-flow",
        following
          ? "border-ink bg-ink text-ink-on"
          : "border-line-2 text-ink hover:bg-ink hover:text-ink-on",
      )}
    >
      {following ? t("following") : t("follow")}
    </button>
  );
}

export function PubRightRail() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <Eyebrow>Hoy en el Pub</Eyebrow>
        <ul className="flex flex-col gap-3">
          {TRENDING.map((tag) => (
            <li key={tag.name}>
              <Link
                href={`/tema/${tag.slug}`}
                className="flex items-baseline justify-between rounded-[8px] transition-colors hover-tint"
              >
                <span className="font-serif text-[17px] text-ink">
                  {tag.name}
                </span>
                <span className="font-mono text-[12px] text-text-3">
                  {compactNumber(tag.flows)} flows
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <Eyebrow>Voces para seguir</Eyebrow>
        <ul className="flex flex-col gap-4">
          {SUGGESTED.map(({ profile, topics }) => (
            <li key={profile.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar
                  name={profile.displayName}
                  color={profile.avatarColor}
                  size={38}
                />
                <div className="min-w-0">
                  <p className="truncate font-sans text-[14px] font-semibold text-ink">
                    {profile.displayName}
                  </p>
                  <p className="truncate font-sans text-[12px] text-text-3">
                    {topics}
                  </p>
                </div>
              </div>
              <FollowButton />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
