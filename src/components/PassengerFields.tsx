import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormField from "@/components/FormField";
import type { Passenger, PassengerErrors } from "@/lib/passengers";

type PassengerFieldsProps = {
  index: number;
  passenger: Passenger;
  errors: PassengerErrors;
  canRemove: boolean;
  onChange: (patch: Partial<Passenger>) => void;
  onRemove: () => void;
};

export default function PassengerFields({
  index,
  passenger,
  errors,
  canRemove,
  onChange,
  onRemove,
}: PassengerFieldsProps) {
  const prefix = `passenger-${passenger.id}`;

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
        <FormField
          label="Lugar de salida"
          name={`${prefix}-departure-place`}
          placeholder="Ej: Terminal de buses"
          value={passenger.departurePlace}
          onChange={(departurePlace) => onChange({ departurePlace })}
          error={errors.departurePlace}
          required
        />
        <FormField
          label="Hora de salida"
          name={`${prefix}-departure-time`}
          type="time"
          value={passenger.departureTime}
          onChange={(departureTime) => onChange({ departureTime })}
          error={errors.departureTime}
          required
        />
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
