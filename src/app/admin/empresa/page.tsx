"use client";

import AppShell from "@/components/AppShell";
import PageSkeleton from "@/components/PageSkeleton";
import CompanySettings from "@/components/admin/CompanySettings";
import { useRequireModule } from "@/lib/auth-context";

export default function CompanyPage() {
  const { ready } = useRequireModule("COMPANY");
  if (!ready) return <PageSkeleton />;

  return (
    <AppShell title="Mi empresa" description="El link para que tus clientes se registren y los datos de tu empresa.">
      <CompanySettings />
    </AppShell>
  );
}
