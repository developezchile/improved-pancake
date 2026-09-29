const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

/** Mirrors org.viajeseventos.model.AppModule. */
export type ModuleKey = "EVENTS" | "BOOKINGS" | "EVENT_ADMIN" | "USERS" | "PROFILES" | "SETTINGS";

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
};

/** The logged-in user: also the modules their profile grants, which drive navigation and page access. */
export type SessionUser = UserResponse & { modules: ModuleKey[] };

export type AuthResponse = {
  token: string;
  user: SessionUser;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
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
};

/** An upcoming event as listed to the caller, with how many passengers they have confirmed on it. */
export type EventListing = EventResponse & { myPassengerCount: number };

/** An event as the EVENT_ADMIN module sees it — inactive and past ones included. */
export type AdminEvent = EventResponse & {
  active: boolean;
  bookingCount: number;
  confirmedPassengers: number;
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
  departurePlace: string;
  /** HH:MM */
  departureTime: string;
  returnPlace: string;
};

export type BookingPassengerResponse = BookingPassengerPayload & { position: number };

export type BookingStatus = "CONFIRMED" | "CANCELLED";

export type BookingResponse = {
  id: number;
  status: BookingStatus;
  createdAt: string;
  cancelledAt: string | null;
  event: EventResponse;
  bookedBy: { id: number; name: string; email: string };
  passengers: BookingPassengerResponse[];
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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
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

/** The caller's own side of events and bookings — requires the EVENTS module. */
export const eventsApi = {
  upcoming: (token: string) => request<{ events: EventListing[] }>("/events", { headers: authHeader(token) }),

  book: (eventId: number, passengers: BookingPassengerPayload[], token: string) =>
    request<BookingResponse>(`/events/${eventId}/bookings`, {
      method: "POST",
      body: JSON.stringify({ passengers }),
      headers: authHeader(token),
    }),

  myBookings: (token: string) => request<{ bookings: BookingResponse[] }>("/bookings/me", { headers: authHeader(token) }),

  cancel: (bookingId: number, token: string) =>
    request<BookingResponse>(`/bookings/${bookingId}/cancel`, { method: "POST", headers: authHeader(token) }),
};

/** Event administration — requires the EVENT_ADMIN module. */
export const eventsAdminApi = {
  list: (token: string) => request<{ events: AdminEvent[] }>("/admin/events", { headers: authHeader(token) }),

  create: (payload: EventPayload, token: string) =>
    request<EventResponse>("/admin/events", { method: "POST", body: JSON.stringify(payload), headers: authHeader(token) }),

  update: (id: number, payload: EventPayload, token: string) =>
    request<EventResponse>(`/admin/events/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: authHeader(token) }),

  remove: (id: number, token: string) => request<void>(`/admin/events/${id}`, { method: "DELETE", headers: authHeader(token) }),
};

/** Every booking, for the operator — requires the BOOKINGS module. */
export const bookingsAdminApi = {
  events: (token: string) => request<{ events: EventResponse[] }>("/admin/bookings/events", { headers: authHeader(token) }),

  list: (eventId: number | null, token: string) =>
    request<{ bookings: BookingResponse[] }>(`/admin/bookings${eventId ? `?eventId=${eventId}` : ""}`, {
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
