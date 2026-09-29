"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FormField from "@/components/FormField";
import PageSkeleton from "@/components/PageSkeleton";
import { ApiError, authApi } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(token ? null : "Este enlace no es válido.");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password !== confirmation) {
      setFieldErrors({ confirmation: "Las contraseñas no coinciden" });
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      router.push("/login?reset=1");
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

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Nueva contraseña</CardTitle>
          <CardDescription>Elige una contraseña de al menos 6 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField
              label="Nueva contraseña"
              name="password"
              type="password"
              value={password}
              onChange={setPassword}
              error={fieldErrors.newPassword}
              required
              autoComplete="new-password"
            />
            <FormField
              label="Repite la contraseña"
              name="confirmation"
              type="password"
              value={confirmation}
              onChange={setConfirmation}
              error={fieldErrors.confirmation}
              required
              autoComplete="new-password"
            />
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={submitting || !token} className="w-full">
              {submitting ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="font-medium text-foreground hover:underline">
              Solicitar un nuevo enlace
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
