"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FormField from "@/components/FormField";
import { ApiError, authApi } from "@/lib/api";
import { useAuth, useRedirectIfAuthenticated } from "@/lib/auth-context";
import { homeFor } from "@/lib/modules";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-zinc-50 dark:bg-black" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { loading } = useRedirectIfAuthenticated();

  const registered = searchParams.get("registered");
  const justRegistered = registered === "1" || registered === "company";
  const passwordReset = searchParams.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const showResend = formError !== null && formError.toLowerCase().includes("verificar tu correo");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setResendState("idle");
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      router.push(homeFor(user.modules));
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors ?? {});
        setFormError(err.message);
      } else {
        setFormError("Ocurrió un error inesperado. Intenta nuevamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function resendVerification() {
    setResendState("sending");
    try {
      await authApi.resendVerification(email);
      setResendState("sent");
    } catch {
      setResendState("idle");
    }
  }

  if (loading) {
    return <div className="flex-1 bg-zinc-50 dark:bg-black" />;
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Iniciar sesión</CardTitle>
          <CardDescription>Accede para ver eventos y reservar tu viaje en bus.</CardDescription>
        </CardHeader>
        <CardContent>
          {passwordReset && (
            <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                Contraseña actualizada. Ya puedes iniciar sesión.
              </AlertDescription>
            </Alert>
          )}

          {justRegistered && (
            <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                {registered === "company" ? "Empresa creada correctamente." : "Cuenta creada correctamente."} Revisa tu
                correo electrónico para verificar tu cuenta antes de iniciar sesión.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField
              label="Correo electrónico"
              name="email"
              type="email"
              value={email}
              onChange={setEmail}
              error={fieldErrors.email}
              required
              autoComplete="email"
            />
            <div className="space-y-1.5">
              <FormField
                label="Contraseña"
                name="password"
                type="password"
                value={password}
                onChange={setPassword}
                error={fieldErrors.password}
                required
                autoComplete="current-password"
              />
              <Link href="/forgot-password" className="block text-right text-xs text-muted-foreground hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {formError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {formError}
                  {showResend && (
                    <div className="mt-1">
                      {resendState === "sent" ? (
                        "Enlace de verificación reenviado."
                      ) : (
                        <Button
                          type="button"
                          variant="link"
                          onClick={resendVerification}
                          disabled={resendState === "sending" || !email}
                          className="h-auto p-0 text-inherit underline underline-offset-2"
                        >
                          Reenviar enlace de verificación
                        </Button>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Tienes una empresa de transporte?{" "}
            <Link href="/signup" className="font-medium text-foreground hover:underline">
              Regístrala
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            ¿Quieres reservar un viaje? Crea tu cuenta con el link de registro de tu empresa de transporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
