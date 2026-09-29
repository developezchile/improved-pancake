"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FormField from "@/components/FormField";
import PageSkeleton from "@/components/PageSkeleton";
import { ApiError, authApi } from "@/lib/api";
import { useRedirectIfAuthenticated } from "@/lib/auth-context";

export default function ForgotPasswordPage() {
  const { loading } = useRedirectIfAuthenticated();
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email);
      setSentMessage(res.message);
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

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
          <CardDescription>Te enviaremos un enlace para crear una nueva contraseña.</CardDescription>
        </CardHeader>
        <CardContent>
          {sentMessage ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <AlertDescription className="text-emerald-700 dark:text-emerald-300">{sentMessage}</AlertDescription>
            </Alert>
          ) : (
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
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Enviando…" : "Enviar enlace"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-foreground hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
