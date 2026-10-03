import type { EventResponse } from "./api";

// Los eventos viven en la base de datos (V3__events_bookings.sql); aquí solo se formatean.

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(isoDate: string) {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatEventDates(event: Pick<EventResponse, "startDate" | "endDate">) {
  if (!event.endDate) return formatDate(event.startDate);
  return `${formatDate(event.startDate)} al ${formatDate(event.endDate)}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" });

/** For API timestamps (LocalDateTime without zone, server time). */
export function formatDateTime(isoDateTime: string) {
  return dateTimeFormatter.format(new Date(isoDateTime));
}

/** Only PuntoTicket's CDN is allowed in next.config's images.remotePatterns; admin-entered URLs
 *  from anywhere else are shown as-is instead of going through the image optimizer. Las dos rutas
 *  tienen que coincidir con los remotePatterns, o el optimizador responde 400. */
const OPTIMIZABLE_PREFIXES = [
  "https://static.ptocdn.net/images/eventos/",
  "https://static.ptocdn.net/resources/images/",
];

export function isOptimizableImage(url: string) {
  return OPTIMIZABLE_PREFIXES.some((prefix) => url.startsWith(prefix));
}

/** Cómo se llama cada ticketera, para la etiqueta del evento. Espejo de `importer/ticketeras.py`. */
const SOURCE_LABELS: Record<string, string> = {
  puntoticket: "PuntoTicket",
  ticketmaster: "Ticketmaster",
  passline: "Passline",
  ticketplus: "Ticketplus",
};

/** El nombre de la ticketera de origen, o null si el evento se cargó a mano (no se etiqueta). */
export function sourceLabel(source: string | null | undefined) {
  if (!source) return null;
  return SOURCE_LABELS[source] ?? source;
}
