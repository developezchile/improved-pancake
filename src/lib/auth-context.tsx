"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, type LoginPayload, type ModuleKey, type RegisterPayload, type SessionUser } from "./api";
import { homeFor } from "./modules";

const TOKEN_STORAGE_KEY = "viajes-eventos.token";

type AuthContextValue = {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<SessionUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: SessionUser) => void;
  hasModule: (module: ModuleKey) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
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
    } catch {
      logout();
    }
  }

  const hasModule = useCallback((module: ModuleKey) => user?.modules.includes(module) ?? false, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, setUser, hasModule }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/** Redirects to /login once session restore finishes and there's no logged-in user. */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  return { user, loading, ready: !loading && user !== null };
}

/**
 * Page-level guard for a module's pages — the UI side of the API's ModuleAccess. Not logged in →
 * /login; logged in without the module → their own home (first module they do have).
 */
export function useRequireModule(module: ModuleKey) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = user?.modules.includes(module) ?? false;

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!allowed) router.replace(homeFor(user.modules));
  }, [loading, user, allowed, router]);

  return { user, ready: !loading && allowed };
}

/** Sends an already signed-in visitor away from /login or /signup, to their home page. */
export function useRedirectIfAuthenticated() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(homeFor(user.modules));
    }
  }, [loading, user, router]);

  return { loading };
}
