"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2Icon, PlusIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PassengerFields from "@/components/PassengerFields";
import PoliciesNotice from "@/components/PoliciesNotice";
import { ApiError, type BookingResponse, type PoliciesResponse, type TripResponse } from "@/lib/api";
import { formatClp, seatsLabel } from "@/lib/bookings";
import { formatTripDateTime } from "@/lib/trips";
import {
  createPassenger,
  normalizePassenger,
  validatePassenger,
  type Passenger,
  type PassengerErrors,
} from "@/lib/passengers";

type TravelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The departure being booked — null while the dialog is closed. */
  trip: TripResponse | null;
  /** Prefills the first passenger — usually the person booking travels too. */
  contact?: { fullName?: string; phone?: string };
  /** The company's terms, shown before confirming. Null while they're still loading. */
  policies: PoliciesResponse | null;
  onConfirm: (passengers: Passenger[]) => Promise<BookingResponse>;
};

export default function TravelDialog({
  open,
  onOpenChange,
  trip,
  contact,
  policies,
  onConfirm,
}: TravelDialogProps) {
  // With a single stop there's nothing to choose, so it comes preselected.
  const defaultStopId = trip?.stops.length === 1 ? String(trip.stops[0].id) : "";
  const [passengers, setPassengers] = useState<Passenger[]>(() => [
    createPassenger(undefined, contact, defaultStopId),
  ]);
  const [errors, setErrors] = useState<Record<string, PassengerErrors>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<BookingResponse | null>(null);

  function updatePassenger(id: string, patch: Partial<Passenger>) {
    setPassengers((current) => current.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setErrors((current) => {
      const passengerErrors = current[id];
      if (!passengerErrors) return current;
      const cleared = { ...passengerErrors };
      for (const key of Object.keys(patch)) delete cleared[key as keyof PassengerErrors];
      return { ...current, [id]: cleared };
    });
  }

  function addPassenger() {
    // El nuevo pasajero hereda parada y retorno del último, que suele ser el mismo grupo.
    setPassengers((current) => [
      ...current,
      createPassenger(current[current.length - 1], undefined, defaultStopId),
    ]);
  }

  function removePassenger(id: string) {
    setPassengers((current) => current.filter((p) => p.id !== id));
    setErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, PassengerErrors> = {};
    for (const passenger of passengers) {
      const passengerErrors = validatePassenger(passenger);
      if (Object.keys(passengerErrors).length > 0) nextErrors[passenger.id] = passengerErrors;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const normalized = passengers.map(normalizePassenger);
    setSubmitting(true);
    setSubmitError(null);
    try {
      setConfirmed(await onConfirm(normalized));
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors(serverErrorsByPassenger(err.fieldErrors, normalized));
        setSubmitError(null);
      } else {
        setSubmitError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const hasErrors = Object.values(errors).some((e) => Object.keys(e).length > 0);
  // What the group costs, each passenger at the price of the stop they board at.
  const total = trip
    ? passengers.reduce(
        // Aún no hay reserva, así que el precio sale de la parada elegida. Sin parada no hay
        // precio que cobrar todavía.
        (sum, p) => sum + (trip.stops.find((s) => String(s.id) === p.stopId)?.priceClp ?? 0),
        0
      )
    : 0;
  const overSeats = trip ? passengers.length > trip.seatsLeft : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{confirmed ? "Viaje registrado" : "Viajar al evento"}</DialogTitle>
          {trip && (
            <DialogDescription>
              {trip.event.name} · sale de {trip.originCommune} el {formatTripDateTime(trip.departureAt)} ·{" "}
              {seatsLabel(trip)}
            </DialogDescription>
          )}
        </DialogHeader>

        {confirmed ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2Icon />
              <AlertDescription>
                Reserva N° {confirmed.id}:{" "}
                {confirmed.passengers.length === 1
                  ? "se registró 1 pasajero."
                  : `se registraron ${confirmed.passengers.length} pasajeros.`}{" "}
                Te enviamos los detalles por correo. Puedes verla en Mis reservas.
              </AlertDescription>
            </Alert>
            <ul className="divide-y rounded-lg border">
              {confirmed.passengers.map((p) => (
                <li key={p.position} className="space-y-0.5 p-3">
                  <p className="font-medium">{p.fullName}</p>
                  <p className="text-muted-foreground">{p.phone}</p>
                  <p className="text-muted-foreground">
                    Sube en {p.departurePlace} a las {p.departureTime} · Retorna a {p.returnPlace}
                  </p>
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-3">
              {passengers.map((passenger, index) => (
                <PassengerFields
                  key={passenger.id}
                  index={index}
                  passenger={passenger}
                  stops={trip?.stops ?? []}
                  errors={errors[passenger.id] ?? {}}
                  canRemove={passengers.length > 1}
                  onChange={(patch) => updatePassenger(passenger.id, patch)}
                  onRemove={() => removePassenger(passenger.id)}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addPassenger}
              disabled={!!trip && passengers.length >= trip.seatsLeft}
            >
              <PlusIcon data-icon="inline-start" />
              Agregar pasajero
            </Button>

            <PoliciesNotice policies={policies} />

            {overSeats && (
              <Alert variant="destructive">
                <AlertDescription>
                  {trip && seatsLabel(trip)} en esta salida: quita pasajeros para poder reservar.
                </AlertDescription>
              </Alert>
            )}

            {hasErrors && (
              <Alert variant="destructive">
                <AlertDescription>Revisa los datos marcados antes de continuar.</AlertDescription>
              </Alert>
            )}

            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="items-center">
              <p className="text-muted-foreground sm:mr-auto">
                {passengers.length === 1 ? "1 pasajero" : `${passengers.length} pasajeros`}
                {total > 0 && <> · total {formatClp(total)}</>}
              </p>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || overSeats}>
                {submitting ? "Registrando…" : "Confirmar viaje"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** The API keys errors as `passengers.<index>.<field>`; the form keys them by passenger id. */
function serverErrorsByPassenger(fieldErrors: Record<string, string>, passengers: Passenger[]) {
  const byPassenger: Record<string, PassengerErrors> = {};
  for (const [key, message] of Object.entries(fieldErrors)) {
    const match = /^passengers\.(\d+)\.(\w+)$/.exec(key);
    const passenger = match && passengers[Number(match[1])];
    if (!passenger) continue;
    byPassenger[passenger.id] = { ...byPassenger[passenger.id], [match[2]]: message };
  }
  return byPassenger;
}
