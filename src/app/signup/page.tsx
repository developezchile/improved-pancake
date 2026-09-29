"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AccountFields, { accountPayload, EMPTY_ACCOUNT } from "@/components/AccountFields";
import FormField from "@/components/FormField";
import { ApiError } from "@/lib/api";
import { useAuth, useRedirectIfAuthenticated } from "@/lib/auth-context";

/**
 * A transport company signs itself up, with its first administrator. Its clients don't sign up here:
 * they use the company's own link (/empresa/<slug>), shown to the administrator in "Mi empresa".
 */
export default function SignupPage() {
  const router = useRouter();
  const { registerCompany } = useAuth();
  const { loading } = useRedirectIfAuthenticated();

  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [account, setAccount] = useState(EMPTY_ACCOUNT);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await registerCompany({
        ...accountPayload(account),
        companyName,
        companySlug: companySlug.trim() || undefined,
      });
      router.push("/login?registered=company");
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

  if (loading) {
    return <div className="flex-1 bg-zinc-50 dark:bg-black" />;
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Registra tu empresa</CardTitle>
          <CardDescription>
            Crea la cuenta de tu empresa de transporte para publicar tus viajes y recibir reservas de tus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField
              label="Nombre de la empresa"
              name="companyName"
              value={companyName}
              onChange={setCompanyName}
              error={fieldErrors.companyName}
              required
              autoComplete="organization"
            />
            <div className="space-y-1.5">
              <FormField
                label="Link para tus clientes (opcional)"
                name="companySlug"
                placeholder="buses-lopez"
                value={companySlug}
                onChange={(v) => setCompanySlug(v.toLowerCase())}
                error={fieldErrors.companySlug}
              />
              <p className="text-xs text-muted-foreground">
                Tus clientes se registran en /empresa/{companySlug.trim() || "…"}. Si lo dejas vacío, se crea a partir del
                nombre. No se puede cambiar después.
              </p>
            </div>

            <p className="border-t pt-4 text-sm font-medium">Tu cuenta de administrador</p>
            <AccountFields values={account} onChange={setAccount} errors={fieldErrors} />

            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creando empresa…" : "Crear empresa"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-foreground hover:underline">
              Inicia sesión
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            ¿Quieres reservar un viaje? Pide a tu empresa de transporte su link de registro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
