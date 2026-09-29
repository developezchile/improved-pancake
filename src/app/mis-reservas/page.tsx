"use client";

import AppShell from "@/components/AppShell";
import MyBookings from "@/components/MyBookings";
import PageSkeleton from "@/components/PageSkeleton";
import { useRequireModule } from "@/lib/auth-context";

export default function MyBookingsPage() {
  const { ready } = useRequireModule("MY_BOOKINGS");
  if (!ready) return <PageSkeleton />;

  return (
    <AppShell title="Mis reservas" description="Los viajes que registraste y sus pasajeros.">
      <MyBookings />
    </AppShell>
  );
}
