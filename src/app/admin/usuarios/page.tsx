"use client";

import AppShell from "@/components/AppShell";
import PageSkeleton from "@/components/PageSkeleton";
import UsersManager from "@/components/admin/UsersManager";
import { useRequireModule } from "@/lib/auth-context";

export default function UsersPage() {
  const { ready } = useRequireModule("USERS");
  if (!ready) return <PageSkeleton />;

  return (
    <AppShell title="Usuarios" description="Administradores y clientes: asigna perfiles y habilita o deshabilita cuentas.">
      <UsersManager />
    </AppShell>
  );
}
