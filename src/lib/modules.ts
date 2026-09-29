import {
  Building2Icon,
  BuildingIcon,
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
  /** Page, route and module stay in place, but it's left out of the navigation and its URL redirects home. */
  hidden?: boolean;
};

/**
 * Pages per module — same idea as condominios' sidebar `navItems`. A page is listed (and
 * reachable) only when the user's profile grants its module; the API enforces the same rule on its
 * side. A module can own several pages. To add a module: add it to AppModule in the API, to
 * ModuleKey in api.ts, to MODULE_LABELS and here.
 */
export const NAV_ITEMS: NavItem[] = [
  { module: "EVENTS", label: "Eventos", href: "/", icon: BusIcon },
  { module: "MY_BOOKINGS", label: "Mis reservas", href: "/mis-reservas", icon: TicketIcon },
  { module: "BOOKINGS", label: "Reservas", href: "/admin/reservas", icon: ClipboardListIcon },
  { module: "EVENT_ADMIN", label: "Gestión de eventos", href: "/admin/eventos", icon: CalendarCogIcon },
  { module: "USERS", label: "Usuarios", href: "/admin/usuarios", icon: UsersIcon },
  // Hidden for now (Mi empresa, Empresas, Perfiles, Configuración): a super admin will get these
  // pages in a later version.
  { module: "COMPANY", label: "Mi empresa", href: "/admin/empresa", icon: BuildingIcon, hidden: true },
  { module: "COMPANIES", label: "Empresas", href: "/admin/empresas", icon: Building2Icon, hidden: true },
  { module: "PROFILES", label: "Perfiles", href: "/admin/perfiles", icon: ShieldCheckIcon, hidden: true },
  { module: "SETTINGS", label: "Configuración", href: "/admin/configuracion", icon: SettingsIcon, hidden: true },
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  EVENTS: "Eventos",
  MY_BOOKINGS: "Mis reservas",
  BOOKINGS: "Reservas",
  EVENT_ADMIN: "Gestión de eventos",
  USERS: "Usuarios",
  COMPANY: "Mi empresa",
  PROFILES: "Perfiles",
  SETTINGS: "Configuración",
  COMPANIES: "Empresas",
};

export function visibleNavItems(modules: ModuleKey[]): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.hidden && modules.includes(item.module));
}

/** Whether a module's pages are hidden — its page guard then turns everyone away. */
export function isHiddenModule(module: ModuleKey): boolean {
  return NAV_ITEMS.some((item) => item.module === module && item.hidden);
}

/** Where to send a user after login: the first page they can see, or their own profile. */
export function homeFor(modules: ModuleKey[]): string {
  return visibleNavItems(modules)[0]?.href ?? "/perfil";
}
