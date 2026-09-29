"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDaysIcon, MapPinIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { ApiError, eventsApi, type BookingResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canCancel } from "@/lib/bookings";
import { formatDateTime, formatEventDates } from "@/lib/events";
import { cn } from "@/lib/utils";

export default function MyBookings() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toCancel, setToCancel] = useState<BookingResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      try {
        const res = await eventsApi.myBookings(token);
        if (cancelled) return;
        setBookings(res.bookings);
        setLoadError(null);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "No se pudieron cargar tus reservas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, refreshKey]);

  async function confirmCancel() {
    if (!token || !toCancel) return;
    await eventsApi.cancel(toCancel.id, token);
    setToCancel(null);
    setRefreshKey((k) => k + 1);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-4">
      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {!loadError && bookings.length === 0 && (
        <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          Aún no tienes reservas.{" "}
          <Link href="/" className="font-medium text-foreground hover:underline">
            Ver eventos
          </Link>
        </div>
      )}

      {bookings.map((booking) => (
        <Card key={booking.id} className={cn(booking.status === "CANCELLED" && "opacity-70")}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {booking.event.name}
              <BookingStatusBadge status={booking.status} />
            </CardTitle>
            <CardDescription className="space-y-1">
              <span className="flex items-center gap-1.5">
                <CalendarDaysIcon className="size-3.5 shrink-0" />
                {formatEventDates(booking.event)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 shrink-0" />
                {booking.event.venue}, {booking.event.commune}
              </span>
              <span className="block text-xs">
                Reserva N° {booking.id} · {formatDateTime(booking.createdAt)}
                {booking.cancelledAt && ` · cancelada el ${formatDateTime(booking.cancelledAt)}`}
              </span>
            </CardDescription>
            {canCancel(booking) && (
              <CardAction>
                <Button variant="outline" size="sm" onClick={() => setToCancel(booking)}>
                  Cancelar reserva
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {booking.passengers.map((p) => (
                <li key={p.position} className="grid gap-x-4 gap-y-0.5 p-3 sm:grid-cols-[1fr_auto]">
                  <span className="font-medium">{p.fullName}</span>
                  <span className="text-muted-foreground sm:text-right">{p.phone}</span>
                  <span className="text-muted-foreground sm:col-span-2">
                    Sale de {p.departurePlace} a las {p.departureTime} · Retorna a {p.returnPlace}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <ConfirmDialog
        open={toCancel !== null}
        onOpenChange={(open) => !open && setToCancel(null)}
        title="Cancelar reserva"
        description={`¿Cancelar la reserva N° ${toCancel?.id} para ${toCancel?.event.name}? Se liberan sus ${toCancel?.passengers.length} pasajero(s).`}
        confirmLabel="Cancelar reserva"
        onConfirm={confirmCancel}
      />
    </div>
  );
}
