const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

/** Mirrors org.viajeseventos.model.AppModule. */
export type ModuleKey =
  | "EVENTS"
  | "MY_BOOKINGS"
  | "BOOKINGS"
  | "EVENT_ADMIN"
  | "TRIP_ADMIN"
  | "FARES"
  | "BOARDING"
  | "REVIEWS"
  | "USERS"
  | "COMPANY"
  | "PROFILES"
  | "SETTINGS"
  | "COMPANIES";

/** The transport company an account belongs to. */
export type CompanyRef = {
  id: number;
  name: string;
  slug: string;
};

export type ProfileRef = {
  id: number;
  code: string | null;
  name: string;
};

export type UserResponse = {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  enabled: boolean;
  emailVerified: boolean;
  createdAt: string | null;
  profile: ProfileRef;
  company: CompanyRef;
};

/** The logged-in user: also the modules their profile grants, which drive navigation and page access. */
export type SessionUser = UserResponse & { modules: ModuleKey[] };

export type AuthResponse = {
  token: string;
  user: SessionUser;
};

export type AccountPayload = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

/** A client signing up through their company's link: `company` is its slug. */
export type RegisterPayload = AccountPayload & { company: string };

/** A transport company signing itself up, with its first administrator. */
export type RegisterCompanyPayload = AccountPayload & {
  companyName: string;
  /** Optional — derived from the name when omitted. */
  companySlug?: string;
};

/** What the client registration page can see about a company before there's an account. */
export type PublicCompany = { name: string; slug: string };

export type CompanyResponse = CompanyRef & {
  contactEmail: string | null;
  active: boolean;
  createdAt: string;
};

/** A company in the platform's list (COMPANIES module). */
export type CompanyListing = CompanyResponse & { userCount: number; eventCount: number };

export type CompanyPayload = {
  name: string;
  contactEmail?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UpdateMePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type ModuleInfo = {
  key: ModuleKey;
  label: string;
  description: string;
};

export type ProfileResponse = {
  id: number;
  code: string | null;
  name: string;
  description: string | null;
  system: boolean;
  editableModules: boolean;
  deletable: boolean;
  modules: ModuleKey[];
  userCount: number;
  createdAt: string;
  updatedAt: string | null;
};

export type ProfilePayload = {
  name: string;
  description?: string;
  modules: ModuleKey[];
};

export type CreateUserPayload = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileId: number;
};

export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileId: number;
  enabled: boolean;
};

export type EventResponse = {
  id: number;
  slug: string;
  name: string;
  venue: string;
  commune: string;
  category: string | null;
  imageUrl: string | null;
  /** ISO date, YYYY-MM-DD. */
  startDate: string;
  endDate: string | null;
  sourceUrl: string | null;
  /** La ticketera de la que se importó, o null si lo cargó una persona. Ver scraper/. */
  source: string | null;
};

export type TripStatus = "DRAFT" | "PUBLISHED" | "CONFIRMED" | "CANCELLED";

/** A pickup point of a departure. `priceClp` is what boarding here costs, outright. */
export type TripStopResponse = {
  id: number;
  position: number;
  commune: string;
  place: string;
  /** HH:MM */
  pickupAt: string;
  priceClp: number;
};

/**
 * A departure (`trips`): one bus to an event, from one origin, with its own seats, price and
 * stops. The derived counts come from the API so every screen agrees on whether a bus is full.
 */
export type TripResponse = {
  id: number;
  event: EventResponse;
  originCommune: string;
  /** ISO local date-time, YYYY-MM-DDTHH:MM:SS. */
  departureAt: string;
  returnAt: string | null;
  /** The cheapest stop — what a listing shows as "desde". A departure has no single price. */
  fromPriceClp: number;
  routeId: number | null;
  routeName: string | null;
  /** Read through the route: a departure doesn't choose a bus of its own. */
  busTypeId: number | null;
  busTypeName: string | null;
  seatsTotal: number;
  seatsTaken: number;
  seatsLeft: number;
  minSeats: number;
  seatsToQuorum: number;
  bookingDeadline: string | null;
  status: TripStatus;
  notes: string | null;
  full: boolean;
  stops: TripStopResponse[];
};

/** A departure as listed to a client, with whether they're already waiting for a seat on it. */
export type TripListing = TripResponse & { onWaitlist: boolean };

/**
 * A departure as the TRIP_ADMIN module sees it. `bookedStopIds` are the stops passengers already
 * board at: they can be edited but not removed, since their bookings point at those rows.
 */
export type AdminTrip = TripResponse & { waitlistCount: number; bookedStopIds: number[] };

/** An upcoming event as listed to the caller: its open departures, full ones included. */
export type EventListing = EventResponse & { myPassengerCount: number; trips: TripListing[] };

/** An event as the EVENT_ADMIN module sees it — inactive and past ones included. */
export type AdminEvent = EventResponse & {
  active: boolean;
  tripCount: number;
  /** Departures of this event with no route yet: no stops, no price, nobody can book them. */
  tripsWithoutRoute: number;
  /** Confirmed bookings only — cancelled ones live in Reservas, which has a filter for them. */
  bookingCount: number;
  confirmedPassengers: number;
};

export type TripStopPayload = {
  /** Omitted for a new stop; the existing id keeps the row (and the bookings pointing at it). */
  id?: number;
  commune: string;
  place: string;
  pickupAt: string;
  priceClp: number;
};

export type TripPayload = {
  /** Only read when creating: a departure's event never changes. */
  eventId?: number;
  /** Derived from the route's first stop; only a departure with neither route nor stops sends it. */
  originCommune?: string;
  departureAt: string;
  returnAt?: string;
  seatsTotal: number;
  minSeats: number;
  bookingDeadline?: string;
  status: TripStatus;
  notes?: string;
  routeId?: number | null;
  /** Left out to take the route's stops as they are; sent to override them for this departure. */
  stops?: TripStopPayload[];
};

/** Qué clase de vehículo es: no todo lo que lleva gente a un evento es un bus. */
export type VehicleKind = "BUS" | "VAN" | "SUV";
export const VEHICLE_KINDS: { value: VehicleKind; label: string }[] = [
  { value: "BUS", label: "Bus" },
  { value: "VAN", label: "Van" },
  { value: "SUV", label: "SUV" },
];

/** De quién es: decide a quién se le reclama si no llega. */
export type VehicleOwnership = "OWN" | "SUBCONTRACTED";
export const VEHICLE_OWNERSHIPS: { value: VehicleOwnership; label: string }[] = [
  { value: "OWN", label: "Propio" },
  { value: "SUBCONTRACTED", label: "Subcontratado" },
];

/**
 * Un vehículo de la flota, con su conductor y su patente. Se llama `BusType` porque la tabla y la
 * columna `bus_type_id` se llaman así desde antes de que hubiera vans y SUV.
 */
export type BusTypeResponse = {
  id: number;
  name: string;
  kind: VehicleKind;
  kindLabel: string;
  ownership: VehicleOwnership;
  /** "Propio", o el nombre de quien lo subcontrata — lo que se muestra en una tabla. */
  ownerLabel: string;
  provider: string | null;
  seats: number;
  plate: string | null;
  driverName: string | null;
  driverRut: string | null;
  description: string | null;
  active: boolean;
};

export type BusTypePayload = {
  name: string;
  kind: VehicleKind;
  ownership: VehicleOwnership;
  provider?: string | null;
  seats: number;
  plate?: string | null;
  driverName?: string | null;
  driverRut?: string | null;
  description?: string | null;
  active: boolean;
};

/**
 * What boarding at one route stop costs, **round trip**. The bus isn't a dimension here: a route
 * runs the same bus always and carries it, so a stop has one price per window. The window is how a
 * price changes without erasing the old one.
 */
export type RouteFare = {
  id: number;
  priceClp: number;
  /** YYYY-MM-DD */
  validFrom: string;
  validTo: string | null;
};

/** A boarding point of a route, in order. Position 1 is the route's departure. */
export type RouteStopResponse = {
  id: number;
  position: number;
  commune: string;
  place: string;
  /** HH:MM */
  pickupAt: string;
  fares: RouteFare[];
};

/**
 * An itinerary the company runs over and over. One route per destination **and per bus**: the same
 * pickup points to another commune, or with another bus, is another route — which is why the bus
 * is here and not on each price.
 */
export type RouteResponse = {
  id: number;
  name: string;
  destinationCommune: string;
  destinationPlace: string | null;
  busTypeId: number | null;
  busTypeName: string | null;
  /** The bus's capacity, to prefill a new departure's seats. 0 when it has no bus yet. */
  busSeats: number;
  active: boolean;
  stops: RouteStopResponse[];
};

export type RouteFarePayload = {
  priceClp: number;
  validFrom: string;
  validTo?: string | null;
};

export type RouteStopPayload = {
  commune: string;
  place: string;
  pickupAt: string;
  fares: RouteFarePayload[];
};

export type RoutePayload = {
  name: string;
  destinationCommune: string;
  destinationPlace?: string | null;
  busTypeId?: number | null;
  active: boolean;
  stops: RouteStopPayload[];
};

/** One passenger on the driver's manifest. */
export type ManifestEntry = {
  bookingId: number;
  ticketCode: string;
  position: number;
  fullName: string;
  phone: string;
  bookedByName: string;
  checkedInAt: string | null;
};

/** The passengers boarding at one stop. */
export type ManifestStop = {
  stopId: number;
  position: number;
  commune: string;
  place: string;
  /** HH:MM */
  pickupAt: string;
  expected: number;
  checkedIn: number;
  passengers: ManifestEntry[];
};

/**
 * The driver's list for one departure, grouped by stop. `unassigned` holds passengers whose
 * booking predates stops: they have nowhere to group under, and leaving them off a manifest is how
 * people get left behind.
 */
/**
 * El vehículo que hace la salida, con quien lo maneja. Viene en el manifiesto y no en `trip`
 * porque el RUT del conductor es dato interno y `trip` también se serializa para las páginas
 * públicas. Null si el recorrido todavía no tiene vehículo asignado.
 */
export type ManifestVehicle = {
  name: string;
  kindLabel: string;
  plate: string | null;
  driverName: string | null;
  driverRut: string | null;
  ownerLabel: string;
  subcontracted: boolean;
};

export type ManifestResponse = {
  trip: TripResponse;
  vehicle: ManifestVehicle | null;
  expected: number;
  checkedIn: number;
  pending: number;
  stops: ManifestStop[];
  unassigned: ManifestEntry[];
};

export type ReviewStatus = "PUBLISHED" | "HIDDEN";

/** What a passenger thought of a departure — only somebody the driver checked in can write one. */
export type ReviewResponse = {
  id: number;
  tripId: number;
  author: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string | null;
  moderatedAt: string | null;
};

/** A departure's published rating, already rounded to one decimal. */
export type RatingResponse = { average: number; count: number };

export type ReviewPayload = { rating: number; comment?: string };

/** A departure the caller travelled on and may review, with their review if they wrote one. */
export type ReviewableTrip = { trip: TripResponse; review: ReviewResponse | null };

/**
 * The company's terms of travel, shown before the client confirms. Any field may be null — an
 * operator who hasn't written one yet simply has nothing shown for it.
 */
export type PoliciesResponse = {
  cancellation: string | null;
  eventCancellation: string | null;
  noShow: string | null;
  refund: string | null;
  /** True when there is nothing to show at all. */
  empty: boolean;
};

export type PoliciesPayload = {
  cancellation?: string;
  eventCancellation?: string;
  noShow?: string;
  refund?: string;
};

/** Who the visitor is buying from, on a page with no session. */
export type PublicCompanyInfo = { name: string; slug: string; contactEmail: string | null };

/**
 * An event in the public catalog. `fromPriceClp` is the cheapest seat on offer across every
 * departure and stop — the number a listing should show.
 */
export type PublicCatalogEvent = EventResponse & {
  fromPriceClp: number;
  originCommunes: string[];
  tripCount: number;
  /** Departures without `notes`: the operator's internal notes never reach a public page. */
  trips: TripResponse[];
};

export type PublicCatalog = {
  company: PublicCompanyInfo;
  events: PublicCatalogEvent[];
  ratings: Record<string, RatingResponse>;
};

/** One departure as a visitor with no session sees it, on the booking page. */
export type PublicTrip = TripResponse & { company: PublicCompanyInfo };

/** Everything one public event page needs, in one round trip. */
export type PublicEventPage = {
  company: PublicCompanyInfo;
  event: EventResponse;
  trips: TripResponse[];
  reviews: ReviewResponse[];
  ratings: Record<string, RatingResponse>;
};

/** Somebody waiting for a seat on a full departure. */
export type WaitlistEntryResponse = {
  id: number;
  name: string;
  email: string;
  seats: number;
  createdAt: string;
  notifiedAt: string | null;
};

export type EventPayload = {
  name: string;
  venue: string;
  commune: string;
  category?: string;
  imageUrl?: string;
  startDate: string;
  endDate?: string;
  sourceUrl?: string;
  active: boolean;
};

export type BookingPassengerPayload = {
  fullName: string;
  phone: string;
  /** The departure's stop they board at. */
  stopId: number;
  returnPlace: string;
};

/** `departurePlace`/`departureTime` are the stop as it was when the booking was made. */
export type BookingPassengerResponse = {
  position: number;
  fullName: string;
  phone: string;
  stopId: number | null;
  /** What this seat cost when it was booked, round trip — frozen, so a fare change can't rewrite it. */
  priceClp: number;
  departurePlace: string;
  /** HH:MM */
  departureTime: string;
  returnPlace: string;
  /** When the driver marked them boarding; null = still to board. */
  checkedInAt: string | null;
};

export type BookingStatus = "CONFIRMED" | "CANCELLED";

export type BookingResponse = {
  id: number;
  /** What the passenger shows and the driver reads at the stop. Belongs to the booking, not to each passenger. */
  ticketCode: string;
  status: BookingStatus;
  createdAt: string;
  cancelledAt: string | null;
  /** Seats the booking holds — zero once cancelled. */
  seats: number;
  trip: TripResponse;
  bookedBy: { id: number; name: string; email: string };
  passengers: BookingPassengerResponse[];
  /**
   * Lo que se cobró por esta reserva, sumando lo que pagó cada pasajero al reservarla. Es el dato
   * del que hay que leer un precio aquí: `trip.fromPriceClp` se calcula desde las paradas de la
   * salida, y una reserva no las trae cargadas — daría cero.
   */
  totalClp: number;
};

export type SmtpSettingsResponse = {
  configured: boolean;
  /** True when these saved settings are the ones sending mail (enabled and complete). */
  active: boolean;
  /** What sends mail when they aren't: "host:port" from the server config, or null = emails are only logged. */
  fallback: string | null;
  provider?: string | null;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  passwordSet?: boolean;
  startTls: boolean;
  fromAddress?: string | null;
  fromName?: string | null;
  enabled: boolean;
  updatedAt?: string | null;
};

export type SmtpSettingsPayload = {
  provider?: string;
  host?: string;
  port?: number;
  username?: string;
  /** Blank keeps the saved password. */
  password?: string;
  startTls: boolean;
  fromAddress?: string;
  fromName?: string;
  enabled: boolean;
};

/** Mirrors viajes-eventos-api's JSON error envelope (org.viajeseventos.dto.response.ErrorResponse). */
type ErrorBody = {
  success: false;
  errorCode: string;
  message: string;
  errors?: Record<string, string>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, body: ErrorBody) {
    super(body.message);
    this.status = status;
    this.errorCode = body.errorCode;
    this.fieldErrors = body.errors;
  }
}

/**
 * `revalidate` is only for the public pages, which are rendered on the server: it caches the
 * response for that many seconds so a crawler (or a burst of visitors) doesn't become a burst of
 * queries. Authenticated calls never pass it — they must not be cached across users.
 */
type RequestOptions = RequestInit & { revalidate?: number };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { revalidate, ...init } = options;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      ...(revalidate === undefined ? {} : { next: { revalidate } }),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(0, {
      success: false,
      errorCode: "NETWORK_ERROR",
      message: "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.",
    });
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body ?? {
      success: false,
      errorCode: "UNKNOWN_ERROR",
      message: "Ocurrió un error inesperado.",
    });
  }

  return body as T;
}

function authHeader(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<{ message: string }>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  registerCompany: (payload: RegisterCompanyPayload) =>
    request<{ message: string; company: PublicCompany }>("/auth/register-company", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  me: (token: string) => request<SessionUser>("/auth/me", { headers: authHeader(token) }),

  updateMe: (payload: UpdateMePayload, token: string) =>
    request<SessionUser>("/auth/me", { method: "PUT", body: JSON.stringify(payload), headers: authHeader(token) }),

  changePassword: (payload: { currentPassword: string; newPassword: string }, token: string) =>
    request<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: authHeader(token),
    }),

  resendVerification: (email: string) =>
    request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyEmail: (token: string) =>
    request<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),
};

/**
 * The public catalog: no token, no module. Called from server components, so these are the only
 * requests in the app that get cached — a crawler reading every event page shouldn't turn into a
 * query per visit.
 *
 * <p>One deployment serves one company (`COMPANY_SLUG` in the API), so the company is never in the
 * URL: nobody searches for a slug.
 */
export const publicApi = {
  company: (revalidate = 300) => request<PublicCompanyInfo>("/public/company", { revalidate }),

  catalog: (revalidate = 60) => request<PublicCatalog>("/public/events", { revalidate }),

  event: (slug: string, revalidate = 60) =>
    request<PublicEventPage>(`/public/events/${encodeURIComponent(slug)}`, { revalidate }),

  /** One departure, for the booking page a visitor reaches before signing in. */
  trip: (tripId: number, revalidate = 30) =>
    request<PublicTrip>(`/public/trips/${tripId}`, { revalidate }),

  policies: (revalidate = 300) => request<PoliciesResponse>("/public/policies", { revalidate }),

  /** The event slugs worth indexing — what sitemap.xml is built from. */
  sitemap: (revalidate = 3600) =>
    request<{ events: { slug: string; startDate: string }[] }>("/public/sitemap", { revalidate }),
};

/** The caller's own side of events, departures and bookings — EVENTS to look, MY_BOOKINGS to book. */
export const eventsApi = {
  upcoming: (token: string) => request<{ events: EventListing[] }>("/events", { headers: authHeader(token) }),

  trip: (tripId: number, token: string) =>
    request<TripResponse>(`/trips/${tripId}`, { headers: authHeader(token) }),

  book: (tripId: number, passengers: BookingPassengerPayload[], token: string) =>
    request<BookingResponse>(`/trips/${tripId}/bookings`, {
      method: "POST",
      body: JSON.stringify({ passengers }),
      headers: authHeader(token),
    }),

  /** Takes a place in the queue for a full departure. */
  joinWaitlist: (tripId: number, seats: number, token: string) =>
    request<{ message: string }>(`/trips/${tripId}/waitlist`, {
      method: "POST",
      body: JSON.stringify({ seats }),
      headers: authHeader(token),
    }),

  leaveWaitlist: (tripId: number, token: string) =>
    request<void>(`/trips/${tripId}/waitlist`, { method: "DELETE", headers: authHeader(token) }),

  myBookings: (token: string) =>
    request<{ bookings: BookingResponse[]; waitlistedTripIds: number[] }>("/bookings/me", {
      headers: authHeader(token),
    }),

  cancel: (bookingId: number, token: string) =>
    request<BookingResponse>(`/bookings/${bookingId}/cancel`, { method: "POST", headers: authHeader(token) }),
};

/** Departure administration — requires the TRIP_ADMIN module. */
export const tripsAdminApi = {
  list: (eventId: number | null, token: string) =>
    request<{ trips: AdminTrip[] }>(`/admin/trips${eventId ? `?eventId=${eventId}` : ""}`, {
      headers: authHeader(token),
    }),

  /** The company's events, to pick which one a new departure goes to. */
  eventOptions: (token: string) =>
    request<{ events: EventResponse[] }>("/admin/trips/events", { headers: authHeader(token) }),

  create: (payload: TripPayload, token: string) =>
    request<TripResponse>("/admin/trips", { method: "POST", body: JSON.stringify(payload), headers: authHeader(token) }),

  update: (id: number, payload: TripPayload, token: string) =>
    request<TripResponse>(`/admin/trips/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: authHeader(token),
    }),

  setStatus: (id: number, status: TripStatus, token: string) =>
    request<TripResponse>(`/admin/trips/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      headers: authHeader(token),
    }),

  remove: (id: number, token: string) =>
    request<void>(`/admin/trips/${id}`, { method: "DELETE", headers: authHeader(token) }),

  waitlist: (id: number, token: string) =>
    request<{ entries: WaitlistEntryResponse[] }>(`/admin/trips/${id}/waitlist`, { headers: authHeader(token) }),
};

/** Routes, their prices and the buses — requires the FARES module. */
export const faresApi = {
  list: (token: string) =>
    request<{ routes: RouteResponse[]; busTypes: BusTypeResponse[] }>("/admin/routes", {
      headers: authHeader(token),
    }),

  create: (payload: RoutePayload, token: string) =>
    request<RouteResponse>("/admin/routes", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: authHeader(token),
    }),

  update: (id: number, payload: RoutePayload, token: string) =>
    request<RouteResponse>(`/admin/routes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: authHeader(token),
    }),

  remove: (id: number, token: string) =>
    request<void>(`/admin/routes/${id}`, { method: "DELETE", headers: authHeader(token) }),

  createBusType: (payload: BusTypePayload, token: string) =>
    request<BusTypeResponse>("/admin/bus-types", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: authHeader(token),
    }),

  updateBusType: (id: number, payload: BusTypePayload, token: string) =>
    request<BusTypeResponse>(`/admin/bus-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: authHeader(token),
    }),

  removeBusType: (id: number, token: string) =>
    request<void>(`/admin/bus-types/${id}`, { method: "DELETE", headers: authHeader(token) }),
};

/**
 * What the departure form needs without the right to edit any of it: the routes it may run and
 * the buses it may run them with. The stops and their prices come with the route, so the form
 * doesn't ask for a price at all.
 */
export const tripRoutesApi = {
  options: (token: string) =>
    request<{ routes: RouteResponse[]; busTypes: BusTypeResponse[] }>("/admin/trip-routes", {
      headers: authHeader(token),
    }),
};

/** Event administration — requires the EVENT_ADMIN module. */
export const eventsAdminApi = {
  list: (token: string) => request<{ events: AdminEvent[] }>("/admin/events", { headers: authHeader(token) }),

  create: (payload: EventPayload, token: string) =>
    request<EventResponse>("/admin/events", { method: "POST", body: JSON.stringify(payload), headers: authHeader(token) }),

  update: (id: number, payload: EventPayload, token: string) =>
    request<EventResponse>(`/admin/events/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: authHeader(token) }),

  /**
   * Activa o desactiva, sin mandar el evento entero: un PUT obligaría a reenviar todos los campos
   * y cualquiera que faltara quedaría borrado.
   */
  setActive: (id: number, active: boolean, token: string) =>
    request<AdminEvent>(`/admin/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
      headers: authHeader(token),
    }),

  remove: (id: number, token: string) => request<void>(`/admin/events/${id}`, { method: "DELETE", headers: authHeader(token) }),
};

/** Every booking, for the operator — requires the BOOKINGS module. */
export const bookingsAdminApi = {
  /** The departures the bookings can be filtered by. */
  trips: (token: string) => request<{ trips: TripResponse[] }>("/admin/bookings/trips", { headers: authHeader(token) }),

  list: (tripId: number | null, token: string) =>
    request<{ bookings: BookingResponse[] }>(`/admin/bookings${tripId ? `?tripId=${tripId}` : ""}`, {
      headers: authHeader(token),
    }),
};

/**
 * Reviews and policies. Reading is the EVENTS module, writing your own is MY_BOOKINGS; moderating
 * what others wrote and editing the policies is the REVIEWS module.
 */
export const reviewsApi = {
  policies: (token: string) => request<PoliciesResponse>("/policies", { headers: authHeader(token) }),

  published: (tripId: number | null, token: string) =>
    request<{ reviews: ReviewResponse[]; ratings: Record<string, RatingResponse> }>(
      `/reviews${tripId ? `?tripId=${tripId}` : ""}`,
      { headers: authHeader(token) }
    ),

  /** The departures the caller travelled on and may still review. */
  reviewable: (token: string) =>
    request<{ trips: ReviewableTrip[] }>("/reviews/reviewable", { headers: authHeader(token) }),

  mine: (token: string) => request<{ reviews: ReviewResponse[] }>("/reviews/me", { headers: authHeader(token) }),

  /** Writes or edits the caller's review of a departure — one per person per departure. */
  save: (tripId: number, payload: ReviewPayload, token: string) =>
    request<ReviewResponse>(`/trips/${tripId}/review`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: authHeader(token),
    }),
};

/** Moderation and the company's policies — requires the REVIEWS module. */
export const reviewsAdminApi = {
  list: (tripId: number | null, token: string) =>
    request<{ reviews: ReviewResponse[] }>(`/admin/reviews${tripId ? `?tripId=${tripId}` : ""}`, {
      headers: authHeader(token),
    }),

  moderate: (id: number, status: ReviewStatus, token: string) =>
    request<ReviewResponse>(`/admin/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      headers: authHeader(token),
    }),

  policies: (token: string) => request<PoliciesResponse>("/admin/policies", { headers: authHeader(token) }),

  savePolicies: (payload: PoliciesPayload, token: string) =>
    request<PoliciesResponse>("/admin/policies", {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: authHeader(token),
    }),
};

/** The driver's side — requires the BOARDING module. */
export const boardingApi = {
  /** The departures leaving around now, which is all a phone at the terminal needs. */
  trips: (token: string) => request<{ trips: TripResponse[] }>("/boarding/trips", { headers: authHeader(token) }),

  manifest: (tripId: number, token: string) =>
    request<ManifestResponse>(`/boarding/trips/${tripId}`, { headers: authHeader(token) }),

  /** Looks a ticket code up without marking anything. */
  byTicketCode: (tripId: number, code: string, token: string) =>
    request<BookingResponse>(`/boarding/trips/${tripId}/ticket?code=${encodeURIComponent(code)}`, {
      headers: authHeader(token),
    }),

  /** Marks the booking's whole group boarding — the usual case, since a group arrives together. */
  checkInGroup: (tripId: number, ticketCode: string, token: string) =>
    request<ManifestResponse>(`/boarding/trips/${tripId}/checkin`, {
      method: "POST",
      body: JSON.stringify({ ticketCode }),
      headers: authHeader(token),
    }),

  /** Marks (or un-marks) one passenger. */
  checkInPassenger: (
    tripId: number,
    bookingId: number,
    position: number,
    checkedIn: boolean,
    token: string
  ) =>
    request<ManifestResponse>(`/boarding/trips/${tripId}/checkin`, {
      method: "POST",
      body: JSON.stringify({ bookingId, position, checkedIn }),
      headers: authHeader(token),
    }),
};

/** Profile maintainer — requires the PROFILES module. */
export const profilesApi = {
  modules: (token: string) => request<{ modules: ModuleInfo[] }>("/profiles/modules", { headers: authHeader(token) }),

  list: (token: string) => request<{ profiles: ProfileResponse[] }>("/profiles", { headers: authHeader(token) }),

  create: (payload: ProfilePayload, token: string) =>
    request<ProfileResponse>("/profiles", { method: "POST", body: JSON.stringify(payload), headers: authHeader(token) }),

  update: (id: number, payload: ProfilePayload, token: string) =>
    request<ProfileResponse>(`/profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: authHeader(token),
    }),

  remove: (id: number, token: string) =>
    request<void>(`/profiles/${id}`, { method: "DELETE", headers: authHeader(token) }),
};

/** Account administration — requires the USERS module. */
export const usersApi = {
  list: (token: string) => request<{ users: UserResponse[] }>("/users", { headers: authHeader(token) }),

  profileOptions: (token: string) =>
    request<{ profiles: ProfileRef[] }>("/users/profile-options", { headers: authHeader(token) }),

  create: (payload: CreateUserPayload, token: string) =>
    request<UserResponse>("/users", { method: "POST", body: JSON.stringify(payload), headers: authHeader(token) }),

  update: (id: number, payload: UpdateUserPayload, token: string) =>
    request<UserResponse>(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: authHeader(token) }),

  /** Confirms the account's email by hand, e.g. when the client never received the link. */
  verifyEmail: (id: number, token: string) =>
    request<UserResponse>(`/users/${id}/verify-email`, { method: "POST", headers: authHeader(token) }),

  resendVerification: (id: number, token: string) =>
    request<{ message: string }>(`/users/${id}/resend-verification`, { method: "POST", headers: authHeader(token) }),
};

/** Companies: the public view of a registration link, the caller's own company (COMPANY module) and every company (COMPANIES module). */
export const companiesApi = {
  publicView: (slug: string) => request<PublicCompany>(`/companies/public/${encodeURIComponent(slug)}`),

  mine: (token: string) => request<CompanyResponse>("/company", { headers: authHeader(token) }),

  updateMine: (payload: CompanyPayload, token: string) =>
    request<CompanyResponse>("/company", { method: "PUT", body: JSON.stringify(payload), headers: authHeader(token) }),

  list: (token: string) => request<{ companies: CompanyListing[] }>("/companies", { headers: authHeader(token) }),

  setActive: (id: number, active: boolean, token: string) =>
    request<CompanyResponse>(`/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
      headers: authHeader(token),
    }),
};

/** Outgoing mail (SMTP) — requires the SETTINGS module. */
export const settingsApi = {
  smtp: (token: string) => request<SmtpSettingsResponse>("/settings/smtp", { headers: authHeader(token) }),

  saveSmtp: (payload: SmtpSettingsPayload, token: string) =>
    request<SmtpSettingsResponse>("/settings/smtp", {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: authHeader(token),
    }),

  testSmtp: (to: string, token: string) =>
    request<{ message: string }>("/settings/smtp/test", {
      method: "POST",
      body: JSON.stringify({ to }),
      headers: authHeader(token),
    }),
};
