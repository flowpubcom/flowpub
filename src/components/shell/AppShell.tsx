"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Bell, Mic } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand";
import { Avatar, Button } from "@/components/ui";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { useAuth } from "@/providers/AuthProvider";
import { NAV, type NavItem } from "./nav";
import { AuthGateModal } from "./AuthGateModal";

export interface AppShellProps {
  children: ReactNode;
  /** Clave de nav activa (pub, explore, messages, notifications, profile). */
  active?: string;
  /** Contenido del riel derecho (desktop xl). */
  rightRail?: ReactNode;
}

/** Chrome persistente: rieles en desktop; top bar + bottom nav + FAB en móvil. */
export function AppShell({ children, active = "pub", rightRail }: AppShellProps) {
  const { t } = useI18n();
  const { play } = useSound();
  const { user } = useAuth();
  const [gate, setGate] = useState(false);

  const onRecord = () => {
    play("rec");
    if (!user) setGate(true);
    // con sesión → ir a /componer (fase de creación)
  };

  return (
    <div className="mx-auto flex w-full max-w-[1280px]">
      {/* Riel izquierdo (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-[236px] flex-none flex-col border-r border-line px-4 py-6 lg:flex">
        <Link href="/" className="mb-7 px-2">
          <Logo markSize={28} textSize={22} />
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.filter((n) => n.desktop).map((item) => (
            <NavLink
              key={item.key}
              item={item}
              active={active === item.key}
              label={t(item.i18n)}
              onPlay={() => play("click")}
            />
          ))}
        </nav>
        <div className="mt-auto pt-4">
          <Button fullWidth size="lg" sound={null} onClick={onRecord}>
            <Mic size={18} />
            {t("record")}
          </Button>
        </div>
      </aside>

      {/* Columna central */}
      <main className="min-w-0 flex-1 pb-24 lg:border-r lg:border-line lg:pb-0">
        <MobileTopBar />
        {children}
      </main>

      {/* Riel derecho (desktop xl) */}
      {rightRail && (
        <aside className="sticky top-0 hidden h-dvh w-[300px] flex-none overflow-y-auto px-5 py-6 xl:block">
          {rightRail}
        </aside>
      )}

      <MobileBottomNav active={active} onRecord={onRecord} recordLabel={t("record")} />
      <AuthGateModal open={gate} onClose={() => setGate(false)} />
    </div>
  );
}

function NavLink({
  item,
  active,
  label,
  onPlay,
}: {
  item: NavItem;
  active: boolean;
  label: string;
  onPlay: () => void;
}) {
  const { Icon } = item;
  return (
    <Link
      href={item.href}
      onClick={onPlay}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[15px] transition-colors duration-150 ease-flow",
        active
          ? "bg-surface-3 font-semibold text-ink"
          : "font-medium text-text-2 hover:bg-[var(--hover)] hover:text-ink",
      )}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 2} />
      {label}
      {item.key === "messages" && (
        <span className="ml-auto h-2 w-2 rounded-pill bg-grana" aria-hidden />
      )}
    </Link>
  );
}

function MobileTopBar() {
  return (
    <header className="glass sticky top-0 z-20 flex items-center justify-between border-b border-line-soft px-4 py-3 lg:hidden">
      <Link href="/" aria-label="FlowPub">
        <Logo markSize={24} textSize={19} />
      </Link>
      <div className="flex items-center gap-1">
        <Link
          href="/notificaciones"
          aria-label="Notificaciones"
          className="relative grid h-9 w-9 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
        >
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-pill bg-grana" aria-hidden />
        </Link>
        <Link href="/perfil" aria-label="Perfil">
          <Avatar name="Invitado" size={30} />
        </Link>
      </div>
    </header>
  );
}

function MobileBottomNav({
  active,
  onRecord,
  recordLabel,
}: {
  active: string;
  onRecord: () => void;
  recordLabel: string;
}) {
  const { play } = useSound();
  const items = NAV.filter((n) => n.mobile);
  const left = items.slice(0, 2);
  const right = items.slice(2);

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-line-soft px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      {left.map((it) => (
        <BottomItem key={it.key} item={it} active={active === it.key} onPlay={() => play("click")} />
      ))}
      <button
        type="button"
        onClick={onRecord}
        aria-label={recordLabel}
        className="grid h-[54px] w-[54px] flex-none -translate-y-2 place-items-center rounded-pill bg-grana text-white shadow-[var(--shadow-grana)] transition-transform duration-150 ease-flow active:scale-[.94]"
      >
        <Mic size={24} />
      </button>
      {right.map((it) => (
        <BottomItem key={it.key} item={it} active={active === it.key} onPlay={() => play("click")} />
      ))}
    </nav>
  );
}

function BottomItem({
  item,
  active,
  onPlay,
}: {
  item: NavItem;
  active: boolean;
  onPlay: () => void;
}) {
  const { Icon } = item;
  return (
    <Link
      href={item.href}
      onClick={onPlay}
      aria-current={active ? "page" : undefined}
      className={cn(
        "grid h-12 w-14 place-items-center rounded-[12px] transition-colors",
        active ? "text-grana" : "text-text-3 hover:text-ink",
      )}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 2} />
    </Link>
  );
}
