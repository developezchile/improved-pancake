"use client";

import AppShell from "@/components/AppShell";
import PageSkeleton from "@/components/PageSkeleton";
import ProfilesManager from "@/components/admin/ProfilesManager";
import { useRequireModule } from "@/lib/auth-context";

export default function ProfilesPage() {
  const { ready } = useRequireModule("PROFILES");
  if (!ready) return <PageSkeleton />;

  return (
    <AppShell title="Perfiles" description="Define qué módulos puede usar cada perfil. Los cambios aplican de inmediato.">
      <ProfilesManager />
    </AppShell>
  );
}
