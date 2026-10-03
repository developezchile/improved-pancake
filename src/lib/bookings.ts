import type { BookingResponse, EventResponse, TripResponse } from "./api";

/** Today in Chile as YYYY-MM-DD — same notion of "today" the API uses to close an event. */
export function todayInChile() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());
}

export function eventHasEnded(event: Pick<EventResponse, "startDate" | "endDate">) {
  return (event.endDate ?? event.startDate) < todayInChile();
}

export function canCancel(booking: BookingResponse) {
  return booking.status === "CONFIRMED" && !eventHasEnded(booking.trip.event);
}

/** Chilean pesos, no decimals: 15000 -> "$15.000". */
export function formatClp(amount: number) {
  return `$${new Intl.NumberFormat("es-CL").format(amount)}`;
}

/**
 * Why a departure can't be booked right now, or null when it can. Mirrors the checks in
 * BookingService so the button explains itself instead of waiting for a 422.
 */
export function bookingBlockedReason(trip: TripResponse): string | null {
  if (trip.status === "CANCELLED") return "Salida cancelada";
  if (trip.status === "DRAFT") return "Salida no publicada";
  if (eventHasEnded(trip.event)) return "El evento ya finalizó";
  if (trip.bookingDeadline && trip.bookingDeadline < new Date().toISOString().slice(0, 19)) {
    return "Las reservas ya cerraron";
  }
  if (trip.full) return "Sin cupos";
  return null;
}

/** "quedan 3 asientos" / "última silla" — what the client needs to decide now. */
export function seatsLabel(trip: TripResponse) {
  if (trip.full) return "Sin cupos";
  if (trip.seatsLeft === 1) return "Queda 1 asiento";
  return `Quedan ${trip.seatsLeft} asientos`;
}
