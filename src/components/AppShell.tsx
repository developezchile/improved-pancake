"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BusIcon, ChevronDownIcon, LogOutIcon, UserIcon } from "lucide-react";
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
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;

  function signOut() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
          <Link href={homeFor(user.modules)} className="flex items-center gap-2 font-semibold">
            <BusIcon className="size-5" />
            Viajes a eventos
          </Link>

          <nav aria-label="Módulos" className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-muted font-medium text-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
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
