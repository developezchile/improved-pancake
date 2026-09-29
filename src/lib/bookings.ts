import type { BookingResponse, EventResponse } from "./api";

/** Today in Chile as YYYY-MM-DD — same notion of "today" the API uses to close an event. */
export function todayInChile() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());
}

export function eventHasEnded(event: Pick<EventResponse, "startDate" | "endDate">) {
  return (event.endDate ?? event.startDate) < todayInChile();
}

export function canCancel(booking: BookingResponse) {
  return booking.status === "CONFIRMED" && !eventHasEnded(booking.event);
}
