"use client";

import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth-context";

type AppShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Layout for signed-in pages: a page heading over the content, under the site's one header. The
 * navigation itself lives in {@link SiteHeader}, which the public pages render too, so the bar
 * doesn't change shape depending on which page you reached.
 */
export default function AppShell({ title, description, actions, children }: AppShellProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <SiteHeader companyName={user.company.name} />

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
