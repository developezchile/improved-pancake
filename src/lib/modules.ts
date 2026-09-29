import {
  BusIcon,
  CalendarCogIcon,
  ClipboardListIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TicketIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "./api";

export type NavItem = {
  module: ModuleKey;
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Pages per module — same idea as condominios' sidebar `navItems`. A page is listed (and
 * reachable) only when the user's profile grants its module; the API enforces the same rule on its
 * side. A module can own several pages. To add a module: add it to AppModule in the API, to
 * ModuleKey in api.ts, to MODULE_LABELS and here.
 */
export const NAV_ITEMS: NavItem[] = [
  { module: "EVENTS", label: "Eventos", href: "/", icon: BusIcon },
  { module: "EVENTS", label: "Mis reservas", href: "/mis-reservas", icon: TicketIcon },
  { module: "BOOKINGS", label: "Reservas", href: "/admin/reservas", icon: ClipboardListIcon },
  { module: "EVENT_ADMIN", label: "Gestión de eventos", href: "/admin/eventos", icon: CalendarCogIcon },
  { module: "USERS", label: "Usuarios", href: "/admin/usuarios", icon: UsersIcon },
  { module: "PROFILES", label: "Perfiles", href: "/admin/perfiles", icon: ShieldCheckIcon },
  { module: "SETTINGS", label: "Configuración", href: "/admin/configuracion", icon: SettingsIcon },
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  EVENTS: "Eventos",
  BOOKINGS: "Reservas",
  EVENT_ADMIN: "Gestión de eventos",
  USERS: "Usuarios",
  PROFILES: "Perfiles",
  SETTINGS: "Configuración",
};

export function visibleNavItems(modules: ModuleKey[]): NavItem[] {
  return NAV_ITEMS.filter((item) => modules.includes(item.module));
}

/** Where to send a user after login: the first page they can see, or their own profile. */
export function homeFor(modules: ModuleKey[]): string {
  return visibleNavItems(modules)[0]?.href ?? "/perfil";
}
