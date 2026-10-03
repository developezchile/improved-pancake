"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  ApiError,
  authApi,
  type LoginPayload,
  type ModuleKey,
  type PublicCompany,
  type RegisterCompanyPayload,
  type RegisterPayload,
  type SessionUser,
} from "./api";
import { homeFor, isHiddenModule } from "./modules";

const TOKEN_STORAGE_KEY = "viajes-eventos.token";

type AuthContextValue = {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<SessionUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  registerCompany: (payload: RegisterCompanyPayload) => Promise<PublicCompany>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: SessionUser) => void;
  hasModule: (module: ModuleKey) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Si el servidor dijo que el token no sirve. Un 401 es un token vencido o falso y un 403 es una
 * cuenta deshabilitada: en ambos casos guardarlo no sirve de nada. Cualquier otra cosa —la API
 * caída, la red cortada, un 500— es pasajera, y el token sigue siendo bueno cuando vuelva.
 */
function isRejectedToken(err: unknown) {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const session = await authApi.me(stored);
        if (cancelled) return;
        setToken(stored);
        setUser(session);
      } catch (err) {
        // Solo un token que el servidor rechaza justifica borrarlo. Un error de red, un 500 o un
        // timeout son transitorios, y borrarlo ahí cierra la sesión de alguien porque la API tosió
        // un segundo — sin aviso y sin vuelta atrás, porque el token ya no está.
        if (isRejectedToken(err)) localStorage.removeItem(TOKEN_STORAGE_KEY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(payload: LoginPayload) {
    const response = await authApi.login(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  }

  async function register(payload: RegisterPayload) {
    // No session is created here — the account isn't verified yet, so the user
    // is sent back to /login to sign in once they confirm the email.
    await authApi.register(payload);
  }

  /** Same as register: the new administrator verifies their email, then signs in. */
  async function registerCompany(payload: RegisterCompanyPayload) {
    return (await authApi.registerCompany(payload)).company;
  }

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  /** Re-reads the session — e.g. after an admin edits the current user's own profile modules. */
  async function refreshUser() {
    if (!token) return;
    try {
      setUser(await authApi.me(token));
    } catch (err) {
      // Mismo criterio que al restaurar: se cierra la sesión solo si el servidor rechazó el token.
      if (isRejectedToken(err)) logout();
    }
  }

  const hasModule = useCallback((module: ModuleKey) => user?.modules.includes(module) ?? false, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, registerCompany, logout, refreshUser, setUser, hasModule }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/**
 * Redirects to /login once session restore finishes and there's no logged-in user, carrying where
 * they were going in `?next=` so signing in lands them back there instead of on a generic home.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  return { user, loading, ready: !loading && user !== null };
}

/**
 * Page-level guard for a module's pages — the UI side of the API's ModuleAccess. Not logged in →
 * /login; logged in without the module, or the module's pages are hidden → their own home (first
 * module they do have).
 */
export function useRequireModule(module: ModuleKey) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !isHiddenModule(module) && (user?.modules.includes(module) ?? false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!allowed) router.replace(homeFor(user.modules));
  }, [loading, user, allowed, router, pathname]);

  return { user, ready: !loading && allowed };
}

/**
 * Sends an already signed-in visitor away from /login or /signup — to wherever they were headed
 * (`next`), or to their home page.
 */
export function useRedirectIfAuthenticated(next?: string | null) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(safeNext(next) ?? homeFor(user.modules));
    }
  }, [loading, user, router, next]);

  return { loading };
}

/**
 * Only same-site paths are honoured as a redirect target. Without this, `?next=https://evil.site`
 * turns the login page into an open redirect — a link that looks like ours and lands somewhere
 * else, which is exactly the shape of a phishing link.
 */
export function safeNext(next?: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
