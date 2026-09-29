"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import FormField from "@/components/FormField";
import { ApiError, type AdminEvent, type EventPayload } from "@/lib/api";

type EventDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = creating a new event. */
  event: AdminEvent | null;
  onSave: (payload: EventPayload) => Promise<void>;
};

export default function EventDialog({ open, onOpenChange, event, onSave }: EventDialogProps) {
  const [name, setName] = useState(event?.name ?? "");
  const [venue, setVenue] = useState(event?.venue ?? "");
  const [commune, setCommune] = useState(event?.commune ?? "");
  const [category, setCategory] = useState(event?.category ?? "");
  const [startDate, setStartDate] = useState(event?.startDate ?? "");
  const [endDate, setEndDate] = useState(event?.endDate ?? "");
  const [imageUrl, setImageUrl] = useState(event?.imageUrl ?? "");
  const [sourceUrl, setSourceUrl] = useState(event?.sourceUrl ?? "");
  const [active, setActive] = useState(event?.active ?? true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Ingresa el nombre";
    if (!venue.trim()) errors.venue = "Ingresa el recinto";
    if (!commune.trim()) errors.commune = "Ingresa la comuna";
    if (!startDate) errors.startDate = "Ingresa la fecha de inicio";
    if (startDate && endDate && endDate < startDate) errors.endDate = "No puede ser anterior al inicio";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        venue: venue.trim(),
        commune: commune.trim(),
        category: category.trim() || undefined,
        startDate,
        endDate: endDate || undefined,
        imageUrl: imageUrl.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        active,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors ?? {});
        setFormError(err.message);
      } else {
        setFormError("Ocurrió un error inesperado.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{event ? "Editar evento" : "Nuevo evento"}</DialogTitle>
          {event && event.bookingCount > 0 && (
            <DialogDescription>
              Tiene {event.bookingCount} reserva(s) con {event.confirmedPassengers} pasajero(s) confirmados. Los cambios de
              fecha o lugar no se avisan automáticamente a los clientes.
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Nombre" name="event-name" value={name} onChange={setName} error={fieldErrors.name} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Recinto" name="event-venue" placeholder="Estadio Nacional" value={venue} onChange={setVenue} error={fieldErrors.venue} required />
            <FormField label="Comuna" name="event-commune" placeholder="Ñuñoa" value={commune} onChange={setCommune} error={fieldErrors.commune} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Fecha de inicio" name="event-start" type="date" value={startDate} onChange={setStartDate} error={fieldErrors.startDate} required />
            <FormField label="Fecha de término" name="event-end" type="date" value={endDate} onChange={setEndDate} error={fieldErrors.endDate} />
            <FormField label="Categoría" name="event-category" placeholder="Rock" value={category} onChange={setCategory} error={fieldErrors.category} />
          </div>
          <FormField
            label="URL de la imagen"
            name="event-image"
            type="url"
            placeholder="https://…"
            value={imageUrl}
            onChange={setImageUrl}
            error={fieldErrors.imageUrl}
          />
          {imageUrl.startsWith("http") && !fieldErrors.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- plain preview of an arbitrary admin-entered URL
            <img src={imageUrl} alt="Vista previa" className="aspect-video w-full rounded-lg border object-cover" />
          )}
          <FormField
            label="Enlace a la venta de entradas"
            name="event-source"
            type="url"
            placeholder="https://www.puntoticket.com/…"
            value={sourceUrl}
            onChange={setSourceUrl}
            error={fieldErrors.sourceUrl}
          />

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label htmlFor="event-active">Activo</Label>
              <p className="text-xs text-muted-foreground">
                Visible para los clientes y abierto a reservas. Las reservas existentes se conservan si lo desactivas.
              </p>
            </div>
            <Switch id="event-active" checked={active} onCheckedChange={setActive} />
          </div>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : event ? "Guardar" : "Crear evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
