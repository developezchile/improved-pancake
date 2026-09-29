"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BusIcon, ChevronDownIcon, LogOutIcon, ShieldIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { homeFor, visibleNavItems } from "@/lib/modules";
import { cn } from "@/lib/utils";

const tabClass =
  "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const activeTabClass = "bg-muted font-medium text-foreground";

type AppShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/** Layout for signed-in pages: navigation built from the modules the user's profile grants. */
export default function AppShell({ title, description, actions, children }: AppShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const navItems = visibleNavItems(user.modules);
  // Admin pages go in one dropdown so the bar fits; a lone admin page stays as a plain tab.
  const adminItems = navItems.filter((item) => item.href.startsWith("/admin/"));
  const groupAdmin = adminItems.length > 1;
  const tabItems = groupAdmin ? navItems.filter((item) => !adminItems.includes(item)) : navItems;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;

  function signOut() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
          <Link href={homeFor(user.modules)} className="flex min-w-0 items-center gap-2 font-semibold">
            <BusIcon className="size-5 shrink-0" />
            <span className="truncate">{user.company.name}</span>
          </Link>

          <nav aria-label="Módulos" className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1">
            {tabItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(tabClass, isActive(item.href) && activeTabClass)}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}

            {groupAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger className={cn(tabClass, pathname.startsWith("/admin/") && activeTabClass)}>
                  <ShieldIcon className="size-4" />
                  Administración
                  <ChevronDownIcon className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {adminItems.map((item) => (
                    <DropdownMenuItem
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className={cn(isActive(item.href) && "bg-muted font-medium")}
                    >
                      <item.icon />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="ml-auto sm:ml-0" />}>
              <UserIcon data-icon="inline-start" />
              <span className="max-w-40 truncate">{displayName}</span>
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <span className="block truncate font-medium text-foreground">{user.email}</span>
                  <span className="block truncate text-xs">{user.company.name}</span>
                  <span className="text-xs">Perfil: {user.profile.name}</span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/perfil")}>
                <UserIcon />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={signOut}>
                <LogOutIcon />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h1>
            {description && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
