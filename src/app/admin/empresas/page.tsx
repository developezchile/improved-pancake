"use client";

import AppShell from "@/components/AppShell";
import PageSkeleton from "@/components/PageSkeleton";
import CompaniesManager from "@/components/admin/CompaniesManager";
import { useRequireModule } from "@/lib/auth-context";

export default function CompaniesPage() {
  const { ready } = useRequireModule("COMPANIES");
  if (!ready) return <PageSkeleton />;

  return (
    <AppShell title="Empresas" description="Las empresas de transporte registradas en la plataforma.">
      <CompaniesManager />
    </AppShell>
  );
}
