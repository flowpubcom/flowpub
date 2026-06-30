import {
  Bell,
  Compass,
  Home,
  MessageCircle,
  User,
  type LucideIcon,
} from "lucide-react";
import type { DictKey } from "@/lib/i18n/dictionaries";

export interface NavItem {
  key: string;
  href: string;
  i18n: DictKey;
  Icon: LucideIcon;
  desktop: boolean;
  mobile: boolean;
}

// El Pub · Explorar · Mensajes · Notificaciones · Perfil. En móvil, las
// notificaciones viven en la top bar (campana); el bottom nav lleva el FAB.
export const NAV: NavItem[] = [
  { key: "pub", href: "/", i18n: "nav.pub", Icon: Home, desktop: true, mobile: true },
  { key: "explore", href: "/explorar", i18n: "nav.explore", Icon: Compass, desktop: true, mobile: true },
  { key: "messages", href: "/mensajes", i18n: "nav.messages", Icon: MessageCircle, desktop: true, mobile: true },
  { key: "notifications", href: "/notificaciones", i18n: "nav.notifications", Icon: Bell, desktop: true, mobile: false },
  { key: "profile", href: "/perfil", i18n: "nav.profile", Icon: User, desktop: true, mobile: true },
];
