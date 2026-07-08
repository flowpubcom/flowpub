"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LayoutDashboard, LogOut, Mic, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand";
import { Avatar, Button } from "@/components/ui";
import { useI18n } from "@/providers/I18nProvider";
import { useSound } from "@/providers/SoundProvider";
import { useAuth, type SessionUser } from "@/providers/AuthProvider";
import { useLegal } from "@/providers/LegalProvider";
import { useUnreadCount } from "@/components/notifications/useUnreadCount";
import { AuthGateModal } from "./AuthGateModal";
import { NAV, type NavItem } from "./nav";
import { LEGAL_ORDER, type LegalId } from "@/lib/legal";
import type { DictKey } from "@/lib/i18n/dictionaries";

const LEGAL_LABEL: Record<LegalId, DictKey> = {
  terminos: "legal.terms",
  privacidad: "legal.privacy",
  cookies: "legal.cookies",
};

/** Fila de links legales + crédito del creador (riel desktop y menú del avatar). */
function LegalLinks({ className }: { className?: string }) {
  const { t } = useI18n();
  const { openLegal } = useLegal();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <p className="flex flex-wrap gap-x-2 gap-y-1">
        {LEGAL_ORDER.map((id, i) => (
          <span key={id} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className="text-text-3">·</span>}
            <button
              type="button"
              onClick={() => openLegal(id)}
              className="font-sans text-[11.5px] font-medium text-text-2 transition-colors hover:text-ink"
            >
              {t(LEGAL_LABEL[id])}
            </button>
          </span>
        ))}
      </p>
      <a
        href="https://juliosahagunsanchez.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-sans text-[11px] text-grana-text transition-opacity hover:opacity-80"
      >
        {t("credit")}
      </a>
    </div>
  );
}

export interface AppShellProps {
  children: ReactNode;
  /** Clave de nav activa (pub, explore, messages, notifications, profile). */
  active?: string;
  /** Contenido del riel derecho (desktop xl). */
  rightRail?: ReactNode;
  /** El contenido maneja su propia altura (sin padding inferior móvil). */
  flush?: boolean;
}

/** Chrome persistente: rieles en desktop; top bar + bottom nav + FAB en móvil. */
export function AppShell({ children, active = "pub", rightRail, flush = false }: AppShellProps) {
  const { t } = useI18n();
  const { play } = useSound();
  const { user } = useAuth();
  const router = useRouter();
  const [gateOpen, setGateOpen] = useState(false);
  const unreadCount = useUnreadCount();

  const onRecord = () => {
    play("rec");
    // Con sesión → a crear; sin sesión → abre la compuerta (arranca /entrar).
    if (user) router.push("/componer");
    else setGateOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1280px]">
      {/* Riel izquierdo (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-[236px] flex-none flex-col border-r border-line px-4 py-6 lg:flex">
        <Link href="/" aria-label="FlowPub" className="mb-7 px-2">
          <Logo markSize={28} textSize={22} beta />
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.filter((n) => n.desktop && n.key !== "profile").map((item) => (
            <NavLink
              key={item.key}
              item={item}
              active={active === item.key}
              label={t(item.i18n)}
              onPlay={() => play("click")}
              unread={item.key === "notifications" ? unreadCount : 0}
            />
          ))}
        </nav>
        {/* Todo lo de cuenta vive al fondo, alrededor de Grabar un Flow: los
            invitados ven Sign up | Login arriba del botón; con sesión, el
            avatar + nombre (menú de cuenta) va debajo. */}
        <div className="mt-auto pt-4">
          {!user && (
            <div className="mb-3 flex items-center justify-center gap-1.5 font-sans text-[15px] font-medium">
              <Link
                href="/entrar?m=signup"
                onClick={() => play("click")}
                className="text-grana-text transition-colors hover:opacity-80"
              >
                {t("auth.signupCta")}
              </Link>
              <span aria-hidden className="text-text-3">|</span>
              <Link
                href="/entrar?m=login"
                onClick={() => play("click")}
                className="text-text-2 transition-colors hover:text-ink"
              >
                {t("auth.loginCta")}
              </Link>
            </div>
          )}
          <Button fullWidth size="lg" sound={null} onClick={onRecord}>
            <Mic size={18} />
            {t("record")}
          </Button>
          {user && (
            <RailAccountMenu
              user={user}
              active={active === "profile"}
              className="mt-3"
            />
          )}
          <LegalLinks className="mt-4 items-center text-center" />
        </div>
      </aside>

      {/* Columna central */}
      <main
        className={cn(
          "min-w-0 flex-1 lg:border-r lg:border-line lg:pb-0",
          flush ? "pb-0" : "pb-24",
        )}
      >
        {!flush && <MobileTopBar user={user} unreadCount={unreadCount} />}
        {children}
      </main>

      {/* Riel derecho (desktop xl) */}
      {rightRail && (
        <aside className="sticky top-0 hidden h-dvh w-[300px] flex-none overflow-y-auto px-5 py-6 xl:block">
          {rightRail}
        </aside>
      )}

      <MobileBottomNav active={active} onRecord={onRecord} recordLabel={t("record")} />

      <AuthGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onChoose={() => {
          setGateOpen(false);
          router.push("/entrar");
        }}
      />
    </div>
  );
}

function NavLink({
  item,
  active,
  label,
  onPlay,
  unread = 0,
}: {
  item: NavItem;
  active: boolean;
  label: string;
  onPlay: () => void;
  unread?: number;
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
      {item.key === "notifications" && unread > 0 && (
        <span className="ml-auto h-2 w-2 rounded-pill bg-grana" aria-hidden />
      )}
    </Link>
  );
}

function MobileTopBar({
  user,
  unreadCount,
}: {
  user: SessionUser | null;
  unreadCount: number;
}) {
  const { t } = useI18n();
  return (
    <header className="glass sticky top-0 z-20 flex items-center justify-between border-b border-line-soft px-4 py-3 lg:hidden">
      <Link href="/" aria-label="FlowPub">
        <Logo markSize={24} textSize={19} beta />
      </Link>
      <div className="flex items-center gap-1">
        {user ? (
          <>
            <Link
              href="/notificaciones"
              aria-label={t("nav.notifications")}
              className="fp-hit-y relative grid h-9 w-9 place-items-center rounded-pill text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-pill bg-grana"
                  aria-hidden
                />
              )}
            </Link>
            <AvatarMenu user={user} />
          </>
        ) : (
          <div className="flex items-center gap-1 font-sans text-[14px] font-semibold">
            <Link
              href="/entrar?m=signup"
              className="rounded-pill px-2.5 py-1.5 text-grana-text transition-colors hover:bg-[var(--hover)]"
            >
              {t("auth.signupCta")}
            </Link>
            <span aria-hidden className="text-text-3">|</span>
            <Link
              href="/entrar?m=login"
              className="rounded-pill px-2.5 py-1.5 text-text-2 transition-colors hover:bg-[var(--hover)] hover:text-ink"
            >
              {t("auth.loginCta")}
            </Link>
          </div>
        )}
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
  const { t } = useI18n();
  const { play } = useSound();
  const items = NAV.filter((n) => n.mobile);
  const left = items.slice(0, 2);
  const right = items.slice(2);

  // Franja baja y compacta: los botones se arriman al centro (gap fijo, no
  // justify-around) y el FAB de grabar conserva su tamaño — por eso resalta.
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-3 border-t border-line-soft px-2 pb-[max(4px,env(safe-area-inset-bottom))] pt-1 lg:hidden">
      {left.map((it) => (
        <BottomItem
          key={it.key}
          item={it}
          label={t(it.i18n)}
          active={active === it.key}
          onPlay={() => play("click")}
        />
      ))}
      <button
        type="button"
        onClick={onRecord}
        aria-label={recordLabel}
        className="mx-1 -my-2 grid h-[54px] w-[54px] flex-none -translate-y-2.5 place-items-center rounded-pill bg-grana text-white shadow-[var(--shadow-grana)] transition-transform duration-150 ease-flow active:scale-[.94]"
      >
        <Mic size={24} />
      </button>
      {right.map((it) => (
        <BottomItem
          key={it.key}
          item={it}
          label={t(it.i18n)}
          active={active === it.key}
          onPlay={() => play("click")}
        />
      ))}
    </nav>
  );
}

function BottomItem({
  item,
  label,
  active,
  onPlay,
}: {
  item: NavItem;
  label: string;
  active: boolean;
  onPlay: () => void;
}) {
  const { Icon } = item;
  return (
    <Link
      href={item.href}
      onClick={onPlay}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "grid h-11 w-12 place-items-center rounded-[12px] transition-colors",
        active ? "text-grana" : "text-text-2 hover:text-ink",
      )}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 2} />
    </Link>
  );
}

/** Menú del avatar (top bar móvil): perfil, salir y los legales — el «FAB de
 *  cuenta» de Gulu, a la FlowPub. Cierra con click fuera y con Esc. */
function AvatarMenu({ user }: { user: SessionUser }) {
  const { t } = useI18n();
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        // El foco regresa al avatar (si no, cae a <body> al desmontar el menú).
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left font-sans text-[14px] font-medium text-ink transition-colors hover:bg-[var(--hover)]";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("menu.aria")}
        onClick={() => {
          play("tick");
          setOpen((o) => !o);
        }}
        className="fp-hit-y grid h-9 w-9 place-items-center rounded-pill transition-transform duration-150 ease-flow active:scale-[.94]"
      >
        <Avatar
          name={user.displayName}
          src={user.avatarUrl}
          color={user.avatarColor}
          size={30}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[210px] rounded-[14px] border border-line bg-surface p-1.5 shadow-[var(--shadow-hover)] [animation:fp-rise_.18s_var(--ease-flow)]"
        >
          <AccountMenuItems
            user={user}
            itemClass={item}
            onNavigate={() => setOpen(false)}
          />
          <div className="mx-2 my-1.5 border-t border-line-soft" aria-hidden />
          <LegalLinks className="px-3 pb-2 pt-1" />
        </div>
      )}
    </div>
  );
}

/** Ítems compartidos del menú de cuenta: ver perfil, panel de admin (si aplica)
 *  y cerrar sesión. Lo usan el menú móvil (top bar) y el del riel desktop. */
function AccountMenuItems({
  user,
  itemClass,
  onNavigate,
}: {
  user: SessionUser;
  itemClass: string;
  onNavigate: () => void;
}) {
  const { t } = useI18n();
  const { play } = useSound();
  const { signOut } = useAuth();
  const router = useRouter();
  return (
    <>
      <button
        type="button"
        role="menuitem"
        className={itemClass}
        onClick={() => {
          play("click");
          onNavigate();
          router.push("/perfil");
        }}
      >
        <User size={16} className="text-text-2" />
        {t("menu.viewProfile")}
      </button>
      {user.isAdmin && (
        <button
          type="button"
          role="menuitem"
          className={itemClass}
          onClick={() => {
            play("click");
            onNavigate();
            router.push("/admin");
          }}
        >
          <LayoutDashboard size={16} className="text-text-2" />
          {t("menu.admin")}
        </button>
      )}
      <button
        type="button"
        role="menuitem"
        className={itemClass}
        onClick={async () => {
          play("soft");
          onNavigate();
          await signOut();
          router.push("/");
        }}
      >
        <LogOut size={16} className="text-text-2" />
        {t("auth.signout")}
      </button>
    </>
  );
}

/** Cuenta en el riel desktop (en lugar del item «Perfil»): avatar + nombre que
 *  abre un menú con ver perfil / panel de admin / cerrar sesión. Abre AL HOVER
 *  (y al foco, para teclado) y se despliega HACIA LA DERECHA anclado al fondo
 *  —el disparador vive al pie del riel, así el menú no se sale de pantalla ni
 *  tapa «Grabar un Flow»—. Cierra al salir (con una gracia corta para cruzar el
 *  hueco) y con Esc (el foco vuelve al disparador). */
function RailAccountMenu({
  user,
  active,
  className,
}: {
  user: SessionUser;
  active: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openNow = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };
  // Gracia corta al salir: permite mover el cursor del disparador al menú
  // (que abre a la derecha) sin que se cierre al cruzar el hueco.
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      // Si el teclado tiene el foco dentro del menú, el hover-out no lo cierra.
      if (rootRef.current?.contains(document.activeElement)) return;
      setOpen(false);
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const item =
    "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left font-sans text-[14px] font-medium text-ink transition-colors hover:bg-[var(--hover)]";

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={openNow}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("menu.aria")}
        aria-current={active ? "page" : undefined}
        onClick={() => {
          play("tick");
          openNow();
        }}
        className={cn(
          "flex w-full items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-left text-[15px] transition-colors duration-150 ease-flow",
          active
            ? "bg-surface-3 font-semibold text-ink"
            : "font-medium text-text-2 hover:bg-[var(--hover)] hover:text-ink",
        )}
      >
        <Avatar
          name={user.displayName}
          src={user.avatarUrl}
          color={user.avatarColor}
          size={26}
        />
        <span className="min-w-0 flex-1 truncate">{user.displayName}</span>
      </button>

      {/* A la derecha del riel y anclado al fondo; el pl-2 tiende un puente
          invisible sobre el hueco para que el hover no se corte al cruzar. */}
      {open && (
        <div className="absolute bottom-0 left-full z-30 pl-2">
          <div
            role="menu"
            className="w-[210px] rounded-[14px] border border-line bg-surface p-1.5 shadow-[var(--shadow-hover)] [animation:fp-emerge_.18s_var(--ease-flow)]"
          >
            <AccountMenuItems
              user={user}
              itemClass={item}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
