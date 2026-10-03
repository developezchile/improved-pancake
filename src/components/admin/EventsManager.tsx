"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BusFrontIcon, PencilIcon, PlusIcon, TriangleAlertIcon, Trash2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ButtonLink from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EventDialog from "@/components/admin/EventDialog";
import { ApiError, eventsAdminApi, type AdminEvent, type EventPayload } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { eventHasEnded } from "@/lib/bookings";
import { formatEventDates, sourceLabel } from "@/lib/events";

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
  /** Id del evento cuyo estado se está guardando, para no dejar apretar dos veces. */
  const [toggling, setToggling] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const eventsMissingRoute = events.filter((e) => e.tripsWithoutRoute > 0);

  /**
   * Cambia el estado desde la tabla. Actualiza la fila al vuelo y la revierte si la API falla:
   * esperar la respuesta para mover el badge se siente roto, y dejarlo cambiado tras un error
   * sería mentir sobre lo que quedó guardado.
   */
  async function toggleActive(event: AdminEvent) {
    if (!token) return;
    const next = !event.active;
    setToggling(event.id);
    setEvents((current) => current.map((e) => (e.id === event.id ? { ...e, active: next } : e)));
    try {
      await eventsAdminApi.setActive(event.id, next, token);
      setActionError(null);
    } catch (err) {
      setEvents((current) => current.map((e) => (e.id === event.id ? { ...e, active: event.active } : e)));
      setActionError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado del evento.");
    } finally {
      setToggling(null);
    }
  }

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

      {(loadError || actionError) && (
        <Alert variant="destructive">
          <AlertDescription>{loadError ?? actionError}</AlertDescription>
        </Alert>
      )}

      {/* Arriba y no solo marcado en la fila: con veinte eventos, lo que está roto no puede
          depender de que alguien recorra la tabla con la vista. */}
      {eventsMissingRoute.length > 0 && (
        <Alert>
          <TriangleAlertIcon />
          <AlertDescription>
            {eventsMissingRoute.length === 1
              ? `"${eventsMissingRoute[0].name}" tiene salidas sin recorrido: no tienen paradas ni precio, así que el cliente las ve pero no puede reservarlas. Elígeles un recorrido desde Salidas.`
              : `${eventsMissingRoute.length} eventos tienen salidas sin recorrido: no tienen paradas ni precio, así que el cliente las ve pero no puede reservarlas. Elígeles un recorrido desde Salidas.`}
          </AlertDescription>
        </Alert>
      )}

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Evento</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Salidas</TableHead>
              <TableHead className="text-right">Pasajeros</TableHead>
              <TableHead className="w-24 pr-4 text-right">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && events.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
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
                  {sourceLabel(e.source) && (
                    <Badge variant="outline" className="mt-1 font-normal">
                      {e.sourceUrl ? (
                        <a href={e.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline">
                          Importado de {sourceLabel(e.source)}
                        </a>
                      ) : (
                        <>Importado de {sourceLabel(e.source)}</>
                      )}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">{formatEventDates(e)}</TableCell>
                <TableCell>
                  {/* El estado se cambia aquí mismo: activar o desactivar un evento es lo que más
                      se hace sobre esta tabla, y abrir el formulario entero para mover un
                      interruptor era el camino largo. Un evento ya finalizado no se ofrece: no
                      hay nada que activar sobre una fecha que pasó. */}
                  {eventHasEnded(e) ? (
                    <Badge variant="outline" title="El evento ya pasó">
                      Finalizado
                    </Badge>
                  ) : (
                    <button
                      type="button"
                      disabled={toggling === e.id}
                      onClick={() => toggleActive(e)}
                      className="rounded-md disabled:opacity-50"
                      title={e.active ? `Desactivar ${e.name}` : `Activar ${e.name}`}
                      aria-pressed={e.active}
                    >
                      <Badge variant={e.active ? "secondary" : "destructive"} className="cursor-pointer">
                        {e.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </button>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {/* El número lleva a sus salidas: publicar un evento y publicar sus buses son
                      dos páginas distintas, y este es el salto que se hace entre ellas. */}
                  {e.tripCount > 0 ? (
                    <Link
                      href={`/admin/salidas?evento=${e.id}`}
                      className="underline-offset-2 hover:underline"
                      title={`Ver las salidas de ${e.name}`}
                    >
                      {e.tripCount}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                  {/* Activarlo no alcanza para que se vea: el catálogo público se arma desde las
                      salidas (PublicCatalogService), así que un evento activo sin ninguna salida
                      publicada no aparece en la portada ni tiene página propia. Se avisa acá porque
                      el interruptor "Activo" está a dos columnas y hace pensar lo contrario. */}
                  {e.active && e.tripCount === 0 && !eventHasEnded(e) && (
                    <Link
                      href={`/admin/salidas?evento=${e.id}`}
                      className="mt-0.5 flex items-center justify-end gap-1 text-xs font-medium text-destructive underline-offset-2 hover:underline"
                      title="Está activo, pero sin salidas publicadas no se muestra a los clientes"
                    >
                      <TriangleAlertIcon className="size-3" />
                      falta publicar salida
                    </Link>
                  )}
                  {/* Una salida sin recorrido no tiene paradas ni precio: el cliente la ve y no
                      puede reservarla. Se avisa aquí porque es el único lugar donde se miran
                      todos los eventos juntos. */}
                  {e.tripsWithoutRoute > 0 && (
                    <Link
                      href={`/admin/salidas?evento=${e.id}`}
                      className="mt-0.5 flex items-center justify-end gap-1 text-xs font-medium text-destructive underline-offset-2 hover:underline"
                      title="Una salida sin recorrido no tiene paradas ni precio"
                    >
                      <TriangleAlertIcon className="size-3" />
                      {e.tripsWithoutRoute === e.tripCount
                        ? "sin recorrido"
                        : `${e.tripsWithoutRoute} sin recorrido`}
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {e.confirmedPassengers}
                  {e.bookingCount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {e.bookingCount} reserva{e.bookingCount === 1 ? "" : "s"} confirmada
                      {e.bookingCount === 1 ? "" : "s"}
                    </div>
                  )}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <div className="flex justify-end gap-1">
                    <ButtonLink
                      href={`/admin/salidas?evento=${e.id}`}
                      variant="ghost"
                      size="icon-sm"
                      title={`Salidas de ${e.name}`}
                    >
                      <BusFrontIcon />
                      <span className="sr-only">Ver las salidas de {e.name}</span>
                    </ButtonLink>
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
          toDelete?.tripCount
            ? `"${toDelete.name}" tiene ${toDelete.tripCount} salida(s) publicada(s), así que no se puede eliminar. Elimínalas desde Salidas — el número de salidas de esta tabla te lleva ahí —, o desactiva el evento desde Editar para ocultarlo y cerrar las reservas.`
            : `¿Eliminar "${toDelete?.name}"? Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
