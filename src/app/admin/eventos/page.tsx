"use client";

import AppShell from "@/components/AppShell";
import PageSkeleton from "@/components/PageSkeleton";
import EventsManager from "@/components/admin/EventsManager";
import { useRequireModule } from "@/lib/auth-context";

export default function EventsAdminPage() {
  const { ready } = useRequireModule("EVENT_ADMIN");
  if (!ready) return <PageSkeleton />;

  return (
    <AppShell
      title="Gestión de eventos"
      description="Crea y edita los eventos. Un evento inactivo no se muestra a los clientes ni acepta reservas."
    >
      <EventsManager />
    </AppShell>
  );
}
