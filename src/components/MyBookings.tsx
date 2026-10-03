"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BusIcon, CalendarDaysIcon, MapPinIcon, QrCodeIcon, StarIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import ReviewDialog from "@/components/ReviewDialog";
import StarRating from "@/components/StarRating";
import TicketDialog from "@/components/TicketDialog";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import {
  ApiError,
  eventsApi,
  reviewsApi,
  type BookingResponse,
  type ReviewPayload,
  type ReviewableTrip,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canCancel, formatClp } from "@/lib/bookings";
import { formatDateTime, formatEventDates } from "@/lib/events";
import { formatTripDateTime } from "@/lib/trips";
import { cn } from "@/lib/utils";

export default function MyBookings() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toCancel, setToCancel] = useState<BookingResponse | null>(null);
  const [ticketFor, setTicketFor] = useState<BookingResponse | null>(null);
  /** The departures this account travelled on and may review, by trip id. */
  const [reviewable, setReviewable] = useState<Record<number, ReviewableTrip>>({});
  const [reviewFor, setReviewFor] = useState<ReviewableTrip | null>(null);
  const [reviewKey, setReviewKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      try {
        const [res, reviewableRes] = await Promise.all([
          eventsApi.myBookings(token),
          reviewsApi.reviewable(token),
        ]);
        if (cancelled) return;
        setBookings(res.bookings);
        setReviewable(Object.fromEntries(reviewableRes.trips.map((item) => [item.trip.id, item])));
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

  function openReview(item: ReviewableTrip) {
    setReviewFor(item);
    setReviewKey((k) => k + 1);
  }

  async function saveReview(payload: ReviewPayload) {
    if (!token || !reviewFor) return;
    await reviewsApi.save(reviewFor.trip.id, payload, token);
    setReviewFor(null);
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
              {booking.trip.event.name}
              <BookingStatusBadge status={booking.status} />
            </CardTitle>
            <CardDescription className="space-y-1">
              <span className="flex items-center gap-1.5">
                <CalendarDaysIcon className="size-3.5 shrink-0" />
                {formatEventDates(booking.trip.event)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 shrink-0" />
                {booking.trip.event.venue}, {booking.trip.event.commune}
              </span>
              <span className="flex items-center gap-1.5">
                <BusIcon className="size-3.5 shrink-0" />
                Sale de {booking.trip.originCommune} · {formatTripDateTime(booking.trip.departureAt)}
                {booking.totalClp > 0 &&
                  ` · ${formatClp(booking.totalClp)} por ${booking.passengers.length} pasajero${
                    booking.passengers.length === 1 ? "" : "s"
                  }, ida y vuelta`}
              </span>
              <span className="block text-xs">
                Reserva N° {booking.id} · {formatDateTime(booking.createdAt)}
                {booking.cancelledAt && ` · cancelada el ${formatDateTime(booking.cancelledAt)}`}
              </span>
              {booking.trip.status === "CANCELLED" && booking.status !== "CANCELLED" && (
                <span className="block text-xs font-medium text-destructive">
                  La empresa canceló esta salida.
                </span>
              )}
            </CardDescription>
            <CardAction className="flex flex-wrap gap-2">
              {booking.status === "CONFIRMED" && (
                <Button size="sm" onClick={() => setTicketFor(booking)}>
                  <QrCodeIcon data-icon="inline-start" />
                  Ver ticket
                </Button>
              )}
              {canCancel(booking) && (
                <Button variant="outline" size="sm" onClick={() => setToCancel(booking)}>
                  Cancelar reserva
                </Button>
              )}
              {/* Solo aparece si el conductor marcó la subida: el check-in es lo que habilita opinar. */}
              {reviewable[booking.trip.id] && (
                <Button variant="outline" size="sm" onClick={() => openReview(reviewable[booking.trip.id])}>
                  <StarIcon data-icon="inline-start" />
                  {reviewable[booking.trip.id].review ? "Editar mi reseña" : "Opinar del viaje"}
                </Button>
              )}
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewable[booking.trip.id]?.review && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                <StarRating value={reviewable[booking.trip.id].review!.rating} size="sm" />
                <span className="text-muted-foreground">
                  {reviewable[booking.trip.id].review!.comment ?? "Tu reseña, sin comentario."}
                </span>
                {reviewable[booking.trip.id].review!.status === "HIDDEN" && (
                  <span className="text-xs text-destructive">La empresa ocultó esta reseña.</span>
                )}
              </div>
            )}
            <ul className="divide-y rounded-lg border">
              {booking.passengers.map((p) => (
                <li key={p.position} className="grid gap-x-4 gap-y-0.5 p-3 sm:grid-cols-[1fr_auto]">
                  <span className="font-medium">{p.fullName}</span>
                  <span className="text-muted-foreground sm:text-right">{p.phone}</span>
                  <span className="text-muted-foreground sm:col-span-2">
                    Sube en {p.departurePlace} a las {p.departureTime} · Retorna a {p.returnPlace}
                    {p.checkedInAt && " · subió al bus"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <TicketDialog
        open={ticketFor !== null}
        onOpenChange={(open) => !open && setTicketFor(null)}
        booking={ticketFor}
      />

      <ReviewDialog
        key={reviewKey}
        open={reviewFor !== null}
        onOpenChange={(open) => !open && setReviewFor(null)}
        reviewable={reviewFor}
        onSave={saveReview}
      />

      <ConfirmDialog
        open={toCancel !== null}
        onOpenChange={(open) => !open && setToCancel(null)}
        title="Cancelar reserva"
        description={`¿Cancelar la reserva N° ${toCancel?.id} para ${toCancel?.trip.event.name}? Se liberan sus ${toCancel?.passengers.length} asiento(s) y se avisa a quien esté en la lista de espera.`}
        confirmLabel="Cancelar reserva"
        onConfirm={confirmCancel}
      />
    </div>
  );
}
