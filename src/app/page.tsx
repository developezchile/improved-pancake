"use client";

import AppShell from "@/components/AppShell";
import EventsModule from "@/components/EventsModule";
import PageSkeleton from "@/components/PageSkeleton";
import { useRequireModule } from "@/lib/auth-context";

export default function Home() {
  const { ready } = useRequireModule("EVENTS");
  if (!ready) return <PageSkeleton />;

  return (
    <AppShell title="Eventos" description="Elige un evento y registra a los pasajeros que viajarán en bus.">
      <EventsModule />
    </AppShell>
  );
}
