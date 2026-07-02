"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui";
import { FlowCard } from "@/components/feed/FlowCard";
import { FollowButton } from "@/components/social/FollowButton";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { compactNumber } from "@/lib/format";
import type { Flow, TrendingTag } from "@/data/types";
import type { SuggestedVoice } from "@/data/railApi";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
      {children}
    </h2>
  );
}

function VoiceRow({ voice }: { voice: SuggestedVoice }) {
  const { profile, topics, following } = voice;
  return (
    <li className="flex items-center justify-between gap-3">
      <Link href={`/@${profile.username}`} className="flex min-w-0 items-center gap-3">
        <Avatar name={profile.displayName} src={profile.avatarUrl} size={46} />
        <span className="min-w-0">
          <span className="block truncate font-sans text-[15px] font-semibold text-ink">
            {profile.displayName}
          </span>
          <span className="block truncate font-sans text-[13px] text-text-3">
            @{profile.username}
            {topics ? ` · ${topics}` : ""}
          </span>
        </span>
      </Link>
      <FollowButton followeeId={profile.id} initial={following} />
    </li>
  );
}

/** /explorar: buscador + (con q) resultados de voces y Flows; (sin q) grid de
 *  temas hacia sus hubs /tema/[slug] + voces nuevas del Pub. */
export function ExploreView({
  q,
  topics,
  voices,
  flows,
}: {
  q: string;
  topics: TrendingTag[];
  voices: SuggestedVoice[];
  flows: Flow[];
}) {
  const { t } = useI18n();
  const { play } = useSound();
  const router = useRouter();
  const [term, setTerm] = useState(q);
  const searching = q.trim().length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = term.trim();
    play("tick");
    router.push(clean ? `/explorar?q=${encodeURIComponent(clean)}` : "/explorar");
  };

  return (
    <div className="mx-auto max-w-[640px] px-4 pb-10 pt-6 lg:px-7">
      <h1 className="font-serif text-[28px] font-medium text-ink">
        {t("explore.title")}
      </h1>
      <p className="mt-1 font-sans text-[14px] text-text-2">
        {t("explore.subtitle")}
      </p>

      <form onSubmit={submit} role="search" className="relative mt-5">
        <Search
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-3"
        />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("explore.search")}
          aria-label={t("explore.search")}
          className="w-full rounded-pill border border-line-2 bg-surface py-3 pl-11 pr-4 font-sans text-[15px] text-ink outline-none transition-colors focus:border-grana"
        />
      </form>

      {searching ? (
        <div className="mt-7">
          <p className="font-serif text-[17px] text-text-2">
            {t("explore.resultsFor", { q })}
          </p>

          {voices.length === 0 && flows.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-serif text-[18px] text-text-2">
                {t("explore.empty", { q })}
              </p>
              <p className="mt-1.5 font-sans text-[13px] text-text-3">
                {t("explore.emptyHint")}
              </p>
            </div>
          ) : (
            <>
              {voices.length > 0 && (
                <section className="mt-6">
                  <Eyebrow>{t("explore.voices")}</Eyebrow>
                  <ul className="flex flex-col gap-4">
                    {voices.map((v) => (
                      <VoiceRow key={v.profile.id} voice={v} />
                    ))}
                  </ul>
                </section>
              )}
              {flows.length > 0 && (
                <section className="mt-8">
                  <Eyebrow>{t("explore.resultsFlows")}</Eyebrow>
                  <div className="flex flex-col gap-5">
                    {flows.map((f) => (
                      <FlowCard key={f.id} flow={f} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <section className="mt-8">
            <Eyebrow>{t("explore.topics")}</Eyebrow>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {topics.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/tema/${tag.slug}`}
                  onClick={() => play("click")}
                  className="group rounded-[14px] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-transform duration-150 ease-flow hover:-translate-y-[2px]"
                >
                  <span className="block font-serif text-[18px] font-medium text-ink">
                    {tag.name}
                  </span>
                  <span className="mt-0.5 block font-mono text-[11px] text-text-3">
                    {tag.flows === 1
                      ? t("explore.flowCountOne")
                      : t("explore.flowCount", { n: compactNumber(tag.flows) })}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {voices.length > 0 && (
            <section className="mt-9">
              <Eyebrow>{t("explore.newVoices")}</Eyebrow>
              <ul className="flex flex-col gap-4">
                {voices.map((v) => (
                  <VoiceRow key={v.profile.id} voice={v} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
