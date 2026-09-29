"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EventCard from "@/components/EventCard";
import TravelDialog from "@/components/TravelDialog";
import { ApiError, eventsApi, type EventListing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Passenger } from "@/lib/passengers";

export default function EventsModule() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<EventListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Bumped after a booking so each card's passenger count is re-read from the API.
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedEvent, setSelectedEvent] = useState<EventListing | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Cambia en cada apertura para que el formulario del modal parta vacío.
  const [dialogKey, setDialogKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      try {
        const res = await eventsApi.upcoming(token);
        if (cancelled) return;
        setEvents(res.events);
        setLoadError(null);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "No se pudieron cargar los eventos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, refreshKey]);

  function openTravelDialog(event: EventListing) {
    setSelectedEvent(event);
    setDialogKey((k) => k + 1);
    setDialogOpen(true);
  }

  async function book(passengers: Passenger[]) {
    if (!token || !selectedEvent) throw new Error("No hay un evento seleccionado.");
    const booking = await eventsApi.book(
      selectedEvent.id,
      passengers.map(({ fullName, phone, departurePlace, departureTime, returnPlace }) => ({
        fullName,
        phone,
        departurePlace,
        departureTime,
        returnPlace,
      })),
      token
    );
    setRefreshKey((k) => k + 1);
    return booking;
  }

  const contact = user
    ? { fullName: [user.firstName, user.lastName].filter(Boolean).join(" "), phone: user.phone ?? "" }
    : undefined;

  return (
    <>
      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {!loading && !loadError && events.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">No hay eventos próximos.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            passengerCount={event.myPassengerCount}
            priority={index < 3}
            onTravel={() => openTravelDialog(event)}
          />
        ))}
      </div>

      <TravelDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        contact={contact}
        onConfirm={book}
      />
    </>
  );
}
