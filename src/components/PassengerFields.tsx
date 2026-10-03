import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormField from "@/components/FormField";
import type { TripStopResponse } from "@/lib/api";
import { formatClp } from "@/lib/bookings";
import { stopLabel } from "@/lib/trips";
import type { Passenger, PassengerErrors } from "@/lib/passengers";

type PassengerFieldsProps = {
  index: number;
  passenger: Passenger;
  /** The departure's stops — where the passenger can board. */
  stops: TripStopResponse[];
  errors: PassengerErrors;
  canRemove: boolean;
  onChange: (patch: Partial<Passenger>) => void;
  onRemove: () => void;
};

export default function PassengerFields({
  index,
  passenger,
  stops,
  errors,
  canRemove,
  onChange,
  onRemove,
}: PassengerFieldsProps) {
  const prefix = `passenger-${passenger.id}`;
  // The price is per stop: boarding further along the route can be cheaper.
  const stopItems = stops.map((stop) => ({
    value: String(stop.id),
    label: stopLabel(stop),
    price: stop.priceClp,
  }));

  return (
    <section aria-labelledby={`${prefix}-title`} className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 id={`${prefix}-title`} className="text-sm font-medium">
          Pasajero {index + 1}
        </h3>
        {canRemove && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
            <Trash2Icon />
            <span className="sr-only">Quitar pasajero {index + 1}</span>
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Nombre completo"
          name={`${prefix}-name`}
          value={passenger.fullName}
          onChange={(fullName) => onChange({ fullName })}
          error={errors.fullName}
          autoComplete="name"
          required
        />
        <FormField
          label="Número de celular"
          name={`${prefix}-phone`}
          type="tel"
          inputMode="tel"
          placeholder="+56 9 1234 5678"
          value={passenger.phone}
          onChange={(phone) => onChange({ phone })}
          error={errors.phone}
          autoComplete="tel"
          required
        />
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${prefix}-stop`}>Dónde te subes</Label>
          <Select
            items={stopItems}
            value={passenger.stopId}
            onValueChange={(v) => onChange({ stopId: v ?? "" })}
          >
            <SelectTrigger id={`${prefix}-stop`} className="w-full" aria-invalid={!!errors.stopId}>
              <SelectValue placeholder="Elige el punto de encuentro" />
            </SelectTrigger>
            <SelectContent>
              {stopItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label} — {formatClp(item.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.stopId && <p className="text-xs text-destructive">{errors.stopId}</p>}
        </div>
        <div className="sm:col-span-2">
          <FormField
            label="Lugar de retorno"
            name={`${prefix}-return-place`}
            placeholder="Ej: Plaza de Armas"
            value={passenger.returnPlace}
            onChange={(returnPlace) => onChange({ returnPlace })}
            error={errors.returnPlace}
            required
          />
        </div>
      </div>
    </section>
  );
}
