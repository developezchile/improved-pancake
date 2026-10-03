"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { ApiError, bookingsAdminApi, type BookingResponse, type TripResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatClp } from "@/lib/bookings";
import { formatTripDateTime } from "@/lib/trips";

const ALL_TRIPS = "all";

/**
 * Operator view (BOOKINGS module): every passenger, filterable by departure, with a per-stop
 * summary — which is the list the driver actually needs, now that stops are the operator's own
 * rather than whatever each passenger typed.
 */
export default function BookingsOverview() {
  const { token } = useAuth();
  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [tripFilter, setTripFilter] = useState<string>(ALL_TRIPS);
  const [showCancelled, setShowCancelled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      try {
        const tripId = tripFilter === ALL_TRIPS ? null : Number(tripFilter);
        const [tripsRes, bookingsRes] = await Promise.all([
          bookingsAdminApi.trips(token),
          bookingsAdminApi.list(tripId, token),
        ]);
        if (cancelled) return;
        setTrips(tripsRes.trips);
        setBookings(bookingsRes.bookings);
        setLoadError(null);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "No se pudieron cargar las reservas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, tripFilter]);

  const confirmed = useMemo(() => bookings.filter((b) => b.status === "CONFIRMED"), [bookings]);
  const visible = showCancelled ? bookings : confirmed;

  /** Confirmed passengers per pickup point and time — how many seats each bus stop needs. */
  const pickups = useMemo(() => {
    const counts = new Map<string, { place: string; time: string; count: number }>();
    for (const booking of confirmed) {
      for (const p of booking.passengers) {
        const key = `${p.departurePlace.toLowerCase()}|${p.departureTime}`;
        const entry = counts.get(key) ?? { place: p.departurePlace, time: p.departureTime, count: 0 };
        entry.count += 1;
        counts.set(key, entry);
      }
    }
    return [...counts.values()].sort((a, b) => a.time.localeCompare(b.time) || a.place.localeCompare(b.place));
  }, [confirmed]);

  const totalPassengers = confirmed.reduce((sum, b) => sum + b.passengers.length, 0);
  const tripItems = [
    { value: ALL_TRIPS, label: "Todas las salidas" },
    ...trips.map((t) => ({
      value: String(t.id),
      label: `${t.event.name} — ${t.originCommune}, ${formatTripDateTime(t.departureAt)}`,
    })),
  ];
  const selectedTrip = tripFilter === ALL_TRIPS ? null : trips.find((t) => String(t.id) === tripFilter) ?? null;
  // What the departure has collected, at the price of the stop each passenger boards at.
  const revenue = selectedTrip
    ? confirmed.reduce(
        (sum, b) =>
          sum +
          // Lo que cada pasajero pagó, congelado al reservar — no lo que su parada cobra hoy.
          // Si la tarifa del recorrido cambió después, esta reserva sigue valiendo lo suyo.
          b.passengers.reduce((acc, p) => acc + p.priceClp, 0),
        0
      )
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Select items={tripItems} value={tripFilter} onValueChange={(v) => setTripFilter(v ?? ALL_TRIPS)}>
          <SelectTrigger className="w-full sm:w-96" aria-label="Filtrar por salida">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tripItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch id="show-cancelled" checked={showCancelled} onCheckedChange={setShowCancelled} />
          <Label htmlFor="show-cancelled">Mostrar canceladas</Label>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Pasajeros confirmados</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{loading ? "—" : totalPassengers}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>
              {selectedTrip ? `Asientos (de ${selectedTrip.seatsTotal})` : "Reservas confirmadas"}
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {loading ? "—" : selectedTrip ? `${totalPassengers} / ${selectedTrip.seatsTotal}` : confirmed.length}
            </CardTitle>
            {selectedTrip && (
              <CardDescription>
                {selectedTrip.seatsToQuorum > 0
                  ? `Faltan ${selectedTrip.seatsToQuorum} para el mínimo de ${selectedTrip.minSeats}`
                  : "Mínimo alcanzado"}
                {revenue > 0 && ` · recaudado ${formatClp(revenue)}`}
              </CardDescription>
            )}
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Por punto de salida</CardDescription>
          </CardHeader>
          <CardContent>
            {pickups.length === 0 ? (
              <p className="text-muted-foreground">Sin pasajeros confirmados.</p>
            ) : (
              <ul className="space-y-1">
                {pickups.map((p) => (
                  <li key={`${p.place}|${p.time}`} className="flex justify-between gap-2">
                    <span className="truncate">
                      {p.time} · {p.place}
                    </span>
                    <span className="font-medium tabular-nums">{p.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Pasajero</TableHead>
              <TableHead>Salida</TableHead>
              <TableHead>Retorno</TableHead>
              {tripFilter === ALL_TRIPS && <TableHead>Salida</TableHead>}
              <TableHead className="pr-4">Reserva</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No hay reservas{tripFilter === ALL_TRIPS ? "" : " para esta salida"}.
                </TableCell>
              </TableRow>
            )}
            {visible.flatMap((booking) =>
              booking.passengers.map((p) => (
                <TableRow key={`${booking.id}-${p.position}`} className={booking.status === "CANCELLED" ? "opacity-60" : undefined}>
                  <TableCell className="pl-4">
                    <div className="font-medium">{p.fullName}</div>
                    <div className="text-xs text-muted-foreground">{p.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div>{p.departurePlace}</div>
                    <div className="text-xs text-muted-foreground">{p.departureTime}</div>
                  </TableCell>
                  <TableCell>{p.returnPlace}</TableCell>
                  {tripFilter === ALL_TRIPS && (
                    <TableCell>
                      <div>{booking.trip.event.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {booking.trip.originCommune} · {formatTripDateTime(booking.trip.departureAt)}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="pr-4">
                    <div className="flex items-center gap-1.5">
                      N° {booking.id}
                      {booking.status === "CANCELLED" && <BookingStatusBadge status={booking.status} />}
                    </div>
                    <div className="text-xs text-muted-foreground">{booking.bookedBy.name}</div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
