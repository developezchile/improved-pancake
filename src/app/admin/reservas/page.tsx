"use client";

import AppShell from "@/components/AppShell";
import PageSkeleton from "@/components/PageSkeleton";
import BookingsOverview from "@/components/admin/BookingsOverview";
import { useRequireModule } from "@/lib/auth-context";

export default function BookingsPage() {
  const { ready } = useRequireModule("BOOKINGS");
  if (!ready) return <PageSkeleton />;

  return (
    <AppShell title="Reservas" description="Pasajeros por evento y punto de salida, para organizar los buses.">
      <BookingsOverview />
    </AppShell>
  );
}
