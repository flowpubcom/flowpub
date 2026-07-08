"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, MapPin, MessageCircle, Mic, PenLine, Pencil, Share2, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar, Button, Modal } from "@/components/ui";
import { FlowCover } from "@/components/cover";
import { FlowEditModal } from "@/components/flow/FlowEditModal";
import { InvitesCard } from "./InvitesCard";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { useAuth } from "@/providers/AuthProvider";
import { setFollow, shareFlow } from "@/data/engagement";
import { getOrCreateDm } from "@/data/messagesClient";
import {
  isValidUsername,
  normalizeUsername,
  updateProfile,
  uploadAvatar,
  uploadBanner,
} from "@/data/profileApi";
import { compactNumber, durationLabel, ogLevel } from "@/lib/format";
import type { Flow } from "@/data/types";
import type { ProfileStats, PublicProfile } from "@/data/profilesApi";

type Tab = "flows" | "liked" | "drafts";

export function ProfileView({
  profile,
  stats,
  flows,
  drafts,
  liked,
  isOwn,
  initialFollowing,
}: {
  profile: PublicProfile;
  stats: ProfileStats;
  flows: Flow[];
  drafts: Flow[];
  liked: Flow[];
  isOwn: boolean;
  initialFollowing: boolean;
}) {
  const { t } = useI18n();
  const { play } = useSound();
  const { user, refresh } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("flows");
  const [following, setFollowing] = useState(initialFollowing);
  const [editOpen, setEditOpen] = useState(false);
  const [editFlow, setEditFlow] = useState<Flow | null>(null);
  // Ediciones recién guardadas: se pintan al instante (tiles + modal) mientras
  // router.refresh() trae la verdad del servidor. Sin esto, reabrir el lápiz
  // antes del refresh mostraría el texto viejo y podría pisar el guardado.
  const [patches, setPatches] = useState<
    Record<string, { title: string; bodyMd: string }>
  >({});

  const toggleFollow = async () => {
    if (!user) {
      play("soft");
      router.push("/entrar");
      return;
    }
    const n = !following;
    setFollowing(n);
    play(n ? "pop" : "soft");
    const res = await setFollow(profile.id, n);
    if (!res.ok) setFollowing(!n);
  };

  const onShare = async () => {
    const out = await shareFlow(profile.displayName, `/@${profile.username}`);
    play(out === "failed" ? "soft" : "pop");
  };

  const [starting, setStarting] = useState(false);
  const [dmError, setDmError] = useState<string | null>(null);
  const startDm = async () => {
    if (!user) {
      play("soft");
      router.push("/entrar");
      return;
    }
    if (starting) return;
    setStarting(true);
    setDmError(null);
    play("click");
    const res = await getOrCreateDm(profile.id);
    if (!res.ok) {
      setStarting(false);
      setDmError(t("msg.startError"));
      play("soft");
      return;
    }
    router.push(`/mensajes/${res.id}`);
  };

  const tabs: [Tab, string][] = [
    ["flows", t("profile.flows")],
    ["liked", t("profile.liked")],
    ...(isOwn ? ([["drafts", t("profile.drafts")]] as [Tab, string][]) : []),
  ];
  const grid = tab === "flows" ? flows : tab === "liked" ? liked : drafts;

  return (
    <div className="px-4 pb-16 lg:px-9">
      {/* avatar + acciones — relative+z para pintar ENCIMA del banner
          (el banner es positioned y sin esto taparía el traslape) */}
      <div className="relative z-10 -mt-11 mb-4 flex items-end justify-between">
        <span className="inline-block rounded-pill border-[5px] border-surface shadow-[var(--shadow-card)]">
          <Avatar
            name={profile.displayName}
            src={profile.avatarUrl}
            size={114}
          />
        </span>
        <div className="flex items-center gap-2.5 pb-1.5">
          <button
            type="button"
            onClick={onShare}
            aria-label={t("share")}
            className="grid h-[42px] w-[42px] place-items-center rounded-pill border border-line-2 text-ink transition-colors hover-tint"
          >
            <Share2 size={17} strokeWidth={1.8} />
          </button>
          {!isOwn && (
            <button
              type="button"
              onClick={() => void startDm()}
              disabled={starting}
              aria-label={t("profile.message")}
              title={t("profile.message")}
              className="grid h-[42px] w-[42px] place-items-center rounded-pill border border-line-2 text-ink transition-colors hover-tint disabled:opacity-50"
            >
              <MessageCircle size={17} strokeWidth={1.8} />
            </button>
          )}
          {isOwn ? (
            <button
              type="button"
              onClick={() => {
                play("click");
                setEditOpen(true);
              }}
              className="flex items-center gap-2 rounded-pill border border-ink px-5 py-2.5 font-sans text-[14px] font-semibold text-ink transition-colors duration-150 ease-flow hover:bg-ink hover:text-ink-on"
            >
              <Pencil size={15} strokeWidth={1.8} />
              {t("profile.edit")}
            </button>
          ) : (
            <button
              type="button"
              aria-pressed={following}
              onClick={toggleFollow}
              className={cn(
                "rounded-pill border px-5 py-2.5 font-sans text-[14px] font-semibold transition-colors duration-150 ease-flow",
                following
                  ? "border-ink bg-ink text-ink-on"
                  : "border-ink text-ink hover:bg-ink hover:text-ink-on",
              )}
            >
              {following ? t("following") : t("follow")}
            </button>
          )}
        </div>
      </div>

      {dmError && (
        <p role="status" className="mb-3 font-sans text-[13px] text-grana-text">
          {dmError}
        </p>
      )}

      {/* identidad */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-serif text-[32px] font-medium leading-[1.1] text-ink">
          {profile.displayName}
        </h1>
        <OgBadge redemptions={profile.inviteRedemptions} />
      </div>
      <p className="mb-3.5 mt-1 font-sans text-[15px] text-text-2">
        @{profile.username}
      </p>
      {profile.bio && (
        <p className="mb-3.5 max-w-[62ch] font-serif text-[18px] leading-[1.55] text-ink">
          {profile.bio}
        </p>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {profile.location && (
          <>
            <span className="inline-flex items-center gap-1.5 font-sans text-[13px] text-text-2">
              <MapPin size={14} strokeWidth={1.8} />
              {profile.location}
            </span>
            <span className="text-text-3">·</span>
          </>
        )}
        {profile.sinceYear && (
          <span className="font-sans text-[13px] text-text-2">
            {t("profile.since", { y: profile.sinceYear })}
          </span>
        )}
        {profile.topics.map((topic) => (
          <span
            key={topic}
            className="ml-1.5 rounded-pill bg-grana-wash px-2.5 py-1 font-sans text-[12px] font-semibold text-grana-700"
          >
            {topic}
          </span>
        ))}
      </div>

      {/* stats */}
      <div className="flex gap-8 border-y border-line py-4">
        <Stat n={stats.flows} label={t("profile.flows")} />
        <Stat n={stats.followers} label={t("profile.followers")} />
        <Stat n={stats.following} label={t("profile.followingCount")} />
      </div>

      {/* invitaciones (solo el dueño): 9 enlaces para correr la voz */}
      {isOwn && <InvitesCard redemptions={profile.inviteRedemptions} />}

      {/* tabs */}
      <div className="mb-5 mt-4 flex gap-1 border-b border-line">
        {tabs.map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={tab === v}
            onClick={() => {
              setTab(v);
              play("tick");
            }}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 font-sans text-[14px] transition-colors duration-150",
              tab === v
                ? "border-grana font-semibold text-ink"
                : "border-transparent font-medium text-text-2 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* grid */}
      {grid.length === 0 ? (
        <p className="py-14 text-center font-sans text-[14px] text-text-2">
          {t("profile.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
          {grid.map((raw) => {
            const flow = patches[raw.id] ? { ...raw, ...patches[raw.id] } : raw;
            return tab === "drafts" ? (
              <DraftTile
                key={flow.id}
                flow={flow}
                label={t("profile.unpublished")}
                onEdit={isOwn ? () => setEditFlow(flow) : undefined}
              />
            ) : (
              <FlowTile
                key={flow.id}
                flow={flow}
                onEdit={
                  isOwn && tab === "flows" ? () => setEditFlow(flow) : undefined
                }
              />
            );
          })}
        </div>
      )}

      {editFlow && (
        <FlowEditModal
          open
          onClose={() => setEditFlow(null)}
          flowId={editFlow.id}
          initialTitle={editFlow.title}
          initialBody={editFlow.bodyMd ?? editFlow.excerpt}
          initialCoverUrl={editFlow.coverUrl}
          initialCoverKind={editFlow.coverKind}
          onSaved={(newTitle, newBody) => {
            setPatches((prev) => ({
              ...prev,
              [editFlow.id]: { title: newTitle, bodyMd: newBody },
            }));
            setEditFlow(null);
            router.refresh();
          }}
        />
      )}

      {isOwn && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          onSaved={async (newUsername) => {
            setEditOpen(false);
            await refresh();
            if (newUsername !== profile.username) {
              router.push(`/@${newUsername}`);
            } else {
              router.refresh();
            }
          }}
        />
      )}
    </div>
  );
}

/** Chip «OG» + N estrellas: aparece a partir de 3 invitaciones canjeadas
 *  (3/6/9). Ocre —nunca grana, reservado para acentos primarios. */
function OgBadge({ redemptions }: { redemptions: number }) {
  const { t } = useI18n();
  const level = ogLevel(redemptions);
  if (level === 0) return null;
  const label = t("badge.og.aria", { n: redemptions });
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1 rounded-pill border border-ocre/30 bg-ocre/10 px-2.5 py-1 text-ocre"
    >
      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em]">
        {t("badge.og.label")}
      </span>
      <span className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: level }).map((_, i) => (
          <Star key={i} size={11} fill="currentColor" strokeWidth={0} />
        ))}
      </span>
    </span>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <p className="font-serif text-[22px] font-medium text-ink">
      {compactNumber(n)}{" "}
      <span className="font-sans text-[14px] font-normal text-text-2">
        {label}
      </span>
    </p>
  );
}

/** Botón de edición sobre un tile (hermano del Link, nunca anidado).
 *  `overCover`: receta sticker (hex fijo, la MISMA excepción del BADGE de
 *  FlowCard — legible sobre ambas variantes de portada); si no, tokens. */
function TileEditButton({
  onEdit,
  label,
  overCover = false,
}: {
  onEdit: () => void;
  label: string;
  overCover?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={label}
      title={label}
      className={cn(
        "absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-pill shadow-[var(--shadow-card)] transition-transform duration-150 ease-flow hover:scale-105 active:scale-[.95]",
        overCover
          ? "bg-[rgba(251,250,246,0.92)] text-[#1A1714]"
          : "border border-line-2 bg-surface text-ink",
      )}
    >
      <PenLine size={14} strokeWidth={2} />
    </button>
  );
}

/** Mini-portada del grid del perfil (tile 16:11 con gradiente y datos). */
function FlowTile({ flow, onEdit }: { flow: Flow; onEdit?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="group relative aspect-[16/11] overflow-hidden rounded-[14px] shadow-[var(--shadow-card)] transition-transform duration-150 ease-flow hover:-translate-y-[3px]">
      <Link
        href={`/flow/${flow.id}`}
        className="absolute inset-0 block"
        aria-label={flow.title}
      >
        <FlowCover
          coverUrl={flow.coverUrl}
          kind={flow.coverKind}
          seed={flow.id}
          title={flow.title}
          className="aspect-[16/11] h-full"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(14,11,9,.86),transparent_55%)]"
        />
        <span className="absolute inset-x-3 bottom-2.5 text-left">
          <span className="block font-serif text-[15px] font-medium leading-[1.2] text-amate">
            {flow.title}
          </span>
          <span className="mt-0.5 block font-mono text-[11px] text-[rgba(242,239,232,.7)]">
            {durationLabel(flow.durationSeconds)} · {compactNumber(flow.likeCount)}{" "}
            <span aria-hidden>♥</span>
          </span>
        </span>
      </Link>
      {onEdit && (
        <TileEditButton onEdit={onEdit} label={t("flow.edit")} overCover />
      )}
    </div>
  );
}

/** Borrador: tile punteado con mic (solo el dueño lo ve). */
function DraftTile({
  flow,
  label,
  onEdit,
}: {
  flow: Flow;
  label: string;
  onEdit?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="relative aspect-[16/11]">
      <Link
        href={`/flow/${flow.id}`}
        className="flex h-full flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-line-2 bg-surface-2 text-text-2 transition-colors hover-tint"
      >
        <Mic size={26} strokeWidth={1.6} />
        <span className="font-serif text-[14px] text-text-2">
          {flow.title || "Borrador"}
        </span>
        <span className="font-mono text-[11px]">
          {durationLabel(flow.durationSeconds)} · {label}
        </span>
      </Link>
      {onEdit && <TileEditButton onEdit={onEdit} label={t("flow.edit")} />}
    </div>
  );
}

function EditProfileModal({
  open,
  onClose,
  profile,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  profile: PublicProfile;
  onSaved: (newUsername: string) => void;
}) {
  const { t } = useI18n();
  const { play } = useSound();
  const [name, setName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl);
  // La fecha viene del AuthProvider (RPC privada), no del perfil público.
  const { user: me } = useAuth();
  const [birthdate, setBirthdate] = useState(me?.birthdate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const onPickPhoto = async (file: File | null) => {
    if (!file) return;
    play("click");
    const url = await uploadAvatar(file);
    if (url) {
      setAvatarUrl(url);
      play("pop");
    } else {
      setError("No se pudo subir la foto. Intenta con otra imagen.");
      play("soft");
    }
  };

  const onPickBanner = async (file: File | null) => {
    if (!file) return;
    play("click");
    const res = await uploadBanner(file);
    if (res.url) {
      setBannerUrl(res.url);
      play("pop");
    } else {
      setError(
        res.pending
          ? "El banner necesita la migración 14 en la base. Avísale a Claude."
          : "No se pudo subir el banner. Intenta con otra imagen.",
      );
      play("soft");
    }
  };

  const save = async () => {
    const uname = normalizeUsername(username);
    if (!name.trim() || !isValidUsername(uname)) {
      setError("Revisa el nombre y el usuario (mínimo 3 caracteres).");
      play("soft");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await updateProfile({
      displayName: name,
      username: uname,
      bio,
      birthdate: birthdate ? birthdate : me?.birthdate ? null : undefined,
    });
    setSaving(false);
    if (!res.ok) {
      setError(
        res.error === "username-taken"
          ? t("onb.err.usernameTaken")
          : t("onb.err.generic"),
      );
      play("soft");
      return;
    }
    play("pop");
    onSaved(uname);
  };

  const inputCls =
    "w-full rounded-md border border-line-2 bg-surface px-3.5 py-2.5 font-sans text-[15px] text-ink outline-none transition-colors placeholder:text-text-3 focus-visible:border-grana";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("profile.edit")}
      className="w-[440px]"
      footer={
        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" sound="soft" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button sound={null} onClick={() => void save()} disabled={saving}>
            {t("profile.saveChanges")}
          </Button>
        </div>
      }
    >
      {/* banner: preview 16:2 con botón encima (foto o generativo de fondo) */}
      <div className="relative mb-4 h-[74px] overflow-hidden rounded-[12px] border border-line bg-[var(--brand-abyss)]">
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <input
          ref={bannerRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onPickBanner(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => bannerRef.current?.click()}
          className="absolute bottom-2 right-2 flex items-center gap-2 rounded-pill bg-[rgba(251,250,246,0.92)] px-3 py-1.5 font-sans text-[12px] font-semibold text-[#1A1714] shadow-[var(--shadow-card)] transition-transform duration-150 ease-flow hover:scale-[1.03]"
        >
          <Camera size={13} strokeWidth={1.8} />
          {t("profile.changeBanner")}
        </button>
      </div>

      <div className="mb-5 flex items-center gap-4">
        <Avatar name={name || profile.displayName} src={avatarUrl} size={74} />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onPickPhoto(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-pill border border-line-2 px-4 py-2 font-sans text-[13px] font-semibold text-ink transition-colors hover-tint"
        >
          <Camera size={15} strokeWidth={1.7} />
          {t("profile.changePhoto")}
        </button>
      </div>

      <div className="flex flex-col gap-3.5">
        <Field label={t("onb.profile.name")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={t("onb.profile.name")}
            className={inputCls}
          />
        </Field>
        <Field label={t("onb.profile.username")}>
          <span className="flex items-center overflow-hidden rounded-md border border-line-2 bg-surface focus-within:border-grana">
            <span className="py-2.5 pl-3.5 pr-1 font-sans text-[15px] text-text-2">
              @
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              aria-label={t("onb.profile.username")}
              className="flex-1 border-none bg-transparent py-2.5 pl-0.5 pr-3.5 font-sans text-[15px] text-ink outline-none"
            />
          </span>
        </Field>
        <Field label={t("onb.profile.bio")}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            aria-label={t("onb.profile.bio")}
            className={cn(inputCls, "resize-none font-serif text-[16px]")}
          />
        </Field>
        <Field label={t("profile.birthdate")}>
          <input
            type="date"
            value={birthdate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthdate(e.target.value)}
            aria-label={t("profile.birthdate")}
            className={inputCls}
          />
          <span className="mt-1 block font-sans text-[12px] text-text-2">
            {t("profile.birthdateHint")}
          </span>
        </Field>
        {error && (
          <p role="status" className="font-sans text-[13px] text-grana">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-[13px] font-semibold text-text-2">
        {label}
      </span>
      {children}
    </label>
  );
}
