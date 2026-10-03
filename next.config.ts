import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.ptocdn.net",
        pathname: "/images/eventos/**",
      },
      {
        // Algunos afiches de PuntoTicket viven acá y no en /images/eventos (los trae así su API).
        protocol: "https",
        hostname: "static.ptocdn.net",
        pathname: "/resources/images/**",
      },
    ],
  },
};

/**
 * NEXT_PUBLIC_API_URL is inlined into the client bundle at build time, and src/lib/api.ts falls
 * back to http://localhost:8080/api without it — which a deployed site would silently ship,
 * pointing every visitor's browser at their own machine. Fail the production build instead.
 */
function assertApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL no está definida. Defínela antes de compilar (en Render: servicio del front → " +
        "Environment), por ejemplo https://<tu-api>.onrender.com/api, y vuelve a desplegar."
    );
  }
  // Render sets RENDER=true in its build environment; a localhost API there is always a mistake.
  if (process.env.RENDER && /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(apiUrl)) {
    throw new Error(
      `NEXT_PUBLIC_API_URL apunta a ${apiUrl} en Render. Usa la URL pública de la API, ` +
        "por ejemplo https://<tu-api>.onrender.com/api."
    );
  }
}

export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) assertApiUrl();
  return nextConfig;
}
