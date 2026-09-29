"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ApiError, authApi } from "@/lib/api";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-zinc-50 dark:bg-black" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [message, setMessage] = useState<string | null>(
    token ? null : "Este enlace de verificación no es válido."
  );
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    authApi
      .verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Ocurrió un error inesperado. Intenta nuevamente.");
      });
  }, [token]);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-8">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Verificación de correo</h1>

        {status === "verifying" && (
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">Verificando tu cuenta…</p>
        )}

        {status === "success" && (
          <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {message}
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {message}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/login" className="font-medium text-neutral-900 hover:underline dark:text-neutral-100">
            Ir a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
