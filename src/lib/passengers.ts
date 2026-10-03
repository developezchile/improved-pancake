export type Passenger = {
  id: string;
  fullName: string;
  phone: string;
  /** The departure's stop they board at; "" until one is picked. */
  stopId: string;
  returnPlace: string;
};

export type PassengerErrors = Partial<Record<Exclude<keyof Passenger, "id">, string>>;

// Celular chileno: 9 dígitos que comienzan con 9, con o sin prefijo 56.
const CHILE_MOBILE_PATTERN = /^(56)?9\d{8}$/;

export function createPassenger(
  copyFrom?: Passenger,
  contact?: { fullName?: string; phone?: string },
  defaultStopId?: string
): Passenger {
  return {
    id: crypto.randomUUID(),
    fullName: contact?.fullName ?? "",
    phone: contact?.phone ?? "",
    // El grupo suele subirse en la misma parada, así que se hereda del pasajero anterior.
    stopId: copyFrom?.stopId ?? defaultStopId ?? "",
    returnPlace: copyFrom?.returnPlace ?? "",
  };
}

export function validatePassenger(passenger: Passenger): PassengerErrors {
  const errors: PassengerErrors = {};
  const fullName = passenger.fullName.trim();

  if (!fullName) errors.fullName = "Ingresa el nombre completo";
  else if (fullName.split(/\s+/).length < 2) errors.fullName = "Ingresa nombre y apellido";

  if (!passenger.phone.trim()) errors.phone = "Ingresa el número de celular";
  else if (!CHILE_MOBILE_PATTERN.test(passenger.phone.replace(/\D/g, "")))
    errors.phone = "Ingresa un celular válido (+56 9 1234 5678)";

  if (!passenger.stopId) errors.stopId = "Elige dónde te subes";
  if (!passenger.returnPlace.trim()) errors.returnPlace = "Ingresa el lugar de retorno";

  return errors;
}

export function normalizePassenger(passenger: Passenger): Passenger {
  return {
    ...passenger,
    fullName: passenger.fullName.trim().replace(/\s+/g, " "),
    phone: passenger.phone.trim(),
    returnPlace: passenger.returnPlace.trim(),
  };
}
