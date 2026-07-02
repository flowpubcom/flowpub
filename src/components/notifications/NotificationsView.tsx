"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Heart,
  MessageCircle,
  Mic,
  Radio,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar, AudioPlayer } from "@/components/ui";
import { Cover } from "@/components/cover";
import type { CoverKind } from "@/lib/covers";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { relativeTime } from "@/lib/format";
import { setFollow } from "@/data/engagement";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/data/notificationsClient";
import type { NotificationItem, NotificationType } from "@/data/notificationsApi";
import type { DictKey } from "@/lib/i18n/dictionaries";

type Filter = "all" | "unread";
type Group = "today" | "week" | "earlier";

const ACTION_KEY: Record<NotificationType, DictKey> = {
  like: "notif.action.like",
  follow: "notif.action.follow",
  comment: "notif.action.comment",
  voice: "notif.action.voice",
  flow: "notif.action.flow",
  mention: "notif.action.mention",
};

const BADGE: Record<NotificationType, { Icon: typeof Heart; className: string }> = {
  like: { Icon: Heart, className: "bg-grana text-white" },
  follow: { Icon: UserPlus, className: "bg-ink text-ink-on" },
  comment: { Icon: MessageCircle, className: "bg-ocre text-white" },
  voice: { Icon: Mic, className: "bg-grana-700 text-white" },
  flow: { Icon: Radio, className: "bg-ink text-ink-on" },
  mention: { Icon: AtSign, className: "bg-ocre text-white" },
};

function groupOf(ageMinutes: number): Group {
  if (ageMinutes < 1440) return "today";
  if (ageMinutes < 10080) return "week";
  return "earlier";
}

const GROUP_ORDER: Group[] = ["today", "week", "earlier"];
const GROUP_KEY: Record<Group, DictKey> = {
  today: "notif.group.today",
  week: "notif.group.week",
  earlier: "notif.group.earlier",
};

export function NotificationsView({
  initialItems,
}: {
  initialItems: NotificationItem[];
}) {
  const { t, lang } = useI18n();
  const { play } = useSound();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<Filter>("all");

  const unreadCount = items.filter((i) => !i.read).length;
  const visible = filter === "unread" ? items.filter((i) => !i.read) : items;

  const grouped = useMemo(() => {
    const byGroup: Record<Group, NotificationItem[]> = {
      today: [],
      week: [],
      earlier: [],
    };
    for (const it of visible) byGroup[groupOf(it.ageMinutes)].push(it);
    return byGroup;
  }, [visible]);

  const markAll = async () => {
    if (!unreadCount) return;
    play("pop");
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await markAllNotificationsRead();
  };

  const markOne = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    void markNotificationRead(id);
  };

  return (
    <div>
      <div className="border-b border-line px-[14px] pb-4 pt-6 sm:px-[28px]">
        <h1 className="font-serif text-[22px] font-medium text-ink">
          {t("notif.title")}
        </h1>
        <p className="mt-1 font-sans text-[13px] text-text-2">
          {t("notif.subtitle")}
        </p>
      </div>

      <div className="flex items-center justify-between px-[14px] py-[22px] sm:px-[28px]">
        <h2 className="font-sans text-[15px] font-semibold text-ink">
          {t("nav.notifications")}
        </h2>
        <button
          type="button"
          onClick={markAll}
          disabled={!unreadCount}
          className="flex items-center gap-1.5 rounded-pill px-2 py-1 font-sans text-[13px] font-semibold text-grana transition-opacity hover:opacity-70 disabled:opacity-30"
        >
          {t("notif.markAllRead")}
        </button>
      </div>

      <div className="flex gap-2 border-b border-line px-[14px] sm:px-[28px]">
        {(["all", "unread"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            data-filter={f}
            onClick={() => {
              play("tick");
              setFilter(f);
            }}
            className={cn(
              "-mb-px border-b-2 px-1 pb-2.5 font-sans text-[14px] transition-colors duration-150 ease-flow",
              filter === f
                ? "border-grana font-semibold text-ink"
                : "border-transparent font-medium text-text-3 hover:text-ink",
            )}
          >
            {t(f === "all" ? "notif.tab.all" : "notif.tab.unread")}
          </button>
        ))}
      </div>

      <div className="px-[14px] pb-6 sm:px-[28px]">
        {visible.length === 0 ? (
          <p className="py-10 text-center font-sans text-[14px] text-text-3">
            {t(filter === "unread" ? "notif.emptyUnread" : "notif.empty")}
          </p>
        ) : (
          GROUP_ORDER.map((g) =>
            grouped[g].length ? (
              <div key={g}>
                <h3 className="px-[14px] pb-1.5 pt-[14px] font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-text-3">
                  {t(GROUP_KEY[g])}
                </h3>
                {grouped[g].map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    lang={lang}
                    t={t}
                    onRead={() => markOne(item.id)}
                  />
                ))}
              </div>
            ) : null,
          )
        )}
      </div>
    </div>
  );
}

function NotificationRow({
  item,
  lang,
  t,
  onRead,
}: {
  item: NotificationItem;
  lang: "es" | "en";
  t: (k: DictKey, vars?: Record<string, string | number>) => string;
  onRead: () => void;
}) {
  const { play } = useSound();
  const router = useRouter();
  const [showTranscript, setShowTranscript] = useState(false);
  const [following, setFollowing] = useState(item.followingActor);

  const { Icon, className: badgeClass } = BADGE[item.type];
  const actorName = item.actor?.displayName ?? "";

  const goTo = () => {
    if (!item.read) onRead();
    if (item.type === "follow" && item.actor) {
      router.push(`/@${item.actor.username}`);
    } else if (item.flowId) {
      router.push(`/flow/${item.flowId}`);
    }
  };

  const toggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.actor) return;
    const n = !following;
    setFollowing(n);
    play(n ? "soft" : "pop");
    const res = await setFollow(item.actor.id, n);
    if (!res.ok) setFollowing(!n);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goTo}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") goTo();
      }}
      data-unread={item.read ? "0" : "1"}
      className={cn(
        "flex cursor-pointer items-start gap-[13px] rounded-[14px] p-[13px] transition-colors duration-200 ease-flow hover:bg-[var(--hover)]",
        !item.read && "bg-grana-wash",
      )}
    >
      <span className="relative flex-none">
        <Avatar name={actorName} src={item.actor?.avatarUrl} size={46} />
        <span
          className={cn(
            "absolute -bottom-[3px] -right-[3px] grid h-[22px] w-[22px] place-items-center rounded-pill",
            badgeClass,
          )}
          aria-hidden
        >
          <Icon size={12} strokeWidth={2.5} />
        </span>
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-sans text-[14px] leading-[1.4] text-ink">
          <span className="font-semibold">{actorName}</span>{" "}
          <span className="text-text-2">{t(ACTION_KEY[item.type])}</span>{" "}
          <span className="font-mono text-[12px] text-text-3">
            {relativeTime(item.ageMinutes, lang)}
          </span>
        </p>

        {item.type === "comment" && item.commentText && (
          <p className="mt-1 truncate font-serif text-[15px] text-text-2">
            “{item.commentText}”
          </p>
        )}

        {item.type === "voice" && (
          <div className="mt-2 max-w-[300px]">
            <AudioPlayer
              src={item.commentAudioUrl ?? undefined}
              durationSeconds={item.commentDurationSeconds ?? 0}
            />
            {item.commentTranscript && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    play("tick");
                    setShowTranscript((v) => !v);
                  }}
                  className="mt-1.5 font-sans text-[12px] font-semibold text-text-2 hover:text-ink"
                >
                  {t("view_transcript")}
                </button>
                {showTranscript && (
                  <p className="mt-1.5 rounded-[10px] border border-line bg-surface-2 p-2.5 font-serif text-[14px] leading-[1.5] text-text-2 [animation:fp-rise_.2s_var(--ease-flow)]">
                    {item.commentTranscript}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {item.type === "follow" && item.actor && (
        <button
          type="button"
          aria-pressed={following}
          onClick={toggleFollow}
          className={cn(
            "flex-none rounded-pill border px-[18px] py-[8px] font-sans text-[13px] font-semibold transition-colors duration-150 ease-flow",
            following
              ? "border-ink bg-ink text-ink-on"
              : "border-line-2 bg-transparent text-ink hover:bg-ink hover:text-ink-on",
          )}
        >
          {following ? t("following") : t("follow")}
        </button>
      )}

      {item.type === "flow" && item.flowId && (
        <span className="h-[46px] w-[46px] flex-none overflow-hidden rounded-[10px] border border-line">
          <Cover
            kind={(item.flowCoverKind as CoverKind | undefined) ?? "auto"}
            seed={item.flowId}
            title={item.flowTitle}
            grain={false}
            className="h-full w-full"
          />
        </span>
      )}
    </div>
  );
}
