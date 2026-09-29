"use client";

import AppShell from "@/components/AppShell";
import MyAccount from "@/components/MyAccount";
import PageSkeleton from "@/components/PageSkeleton";
import { useRequireAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { ready } = useRequireAuth();
  if (!ready) return <PageSkeleton />;

  return (
    <AppShell title="Mi perfil" description="Tus datos de contacto y tu contraseña.">
      <MyAccount />
    </AppShell>
  );
}
