"use client";

import { useEffect, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EventDialog from "@/components/admin/EventDialog";
import { ApiError, eventsAdminApi, type AdminEvent, type EventPayload } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { eventHasEnded } from "@/lib/bookings";
import { formatEventDates } from "@/lib/events";

type DialogState = { open: boolean; event: AdminEvent | null; key: number };

/** EVENT_ADMIN module: every event, with create/edit/activate/delete. */
export default function EventsManager() {
  const { token } = useAuth();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialog, setDialog] = useState<DialogState>({ open: false, event: null, key: 0 });
  const [toDelete, setToDelete] = useState<AdminEvent | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      try {
        const res = await eventsAdminApi.list(token);
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

  function openDialog(event: AdminEvent | null) {
    setDialog((d) => ({ open: true, event, key: d.key + 1 }));
  }

  async function save(payload: EventPayload) {
    if (!token) return;
    if (dialog.event) await eventsAdminApi.update(dialog.event.id, payload, token);
    else await eventsAdminApi.create(payload, token);
    setDialog((d) => ({ ...d, open: false }));
    setRefreshKey((k) => k + 1);
  }

  async function confirmDelete() {
    if (!token || !toDelete) return;
    await eventsAdminApi.remove(toDelete.id, token);
    setToDelete(null);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{loading ? "Cargando…" : `${events.length} eventos`}</p>
        <Button onClick={() => openDialog(null)} disabled={loading}>
          <PlusIcon data-icon="inline-start" />
          Nuevo evento
        </Button>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Evento</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Pasajeros</TableHead>
              <TableHead className="w-24 pr-4 text-right">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && events.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No hay eventos. Crea el primero.
                </TableCell>
              </TableRow>
            )}
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="pl-4 whitespace-normal">
                  <div className="font-medium">{e.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.venue}, {e.commune}
                    {e.category && ` · ${e.category}`}
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal">{formatEventDates(e)}</TableCell>
                <TableCell>
                  {eventHasEnded(e) ? (
                    <Badge variant="outline">Finalizado</Badge>
                  ) : e.active ? (
                    <Badge variant="secondary">Activo</Badge>
                  ) : (
                    <Badge variant="destructive">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {e.confirmedPassengers}
                  {e.bookingCount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {e.bookingCount} reserva{e.bookingCount === 1 ? "" : "s"}
                    </div>
                  )}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openDialog(e)}>
                      <PencilIcon />
                      <span className="sr-only">Editar {e.name}</span>
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(e)}>
                      <Trash2Icon />
                      <span className="sr-only">Eliminar {e.name}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <EventDialog
        key={dialog.key}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        event={dialog.event}
        onSave={save}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Eliminar evento"
        description={
          toDelete?.bookingCount
            ? `"${toDelete.name}" tiene ${toDelete.bookingCount} reserva(s), así que no se puede eliminar. Desactívalo desde Editar para ocultarlo y cerrar las reservas.`
            : `¿Eliminar "${toDelete?.name}"? Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
