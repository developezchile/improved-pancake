"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { BusIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AccountFields, { accountPayload, EMPTY_ACCOUNT } from "@/components/AccountFields";
import { ApiError, companiesApi, type PublicCompany } from "@/lib/api";
import { useAuth, useRedirectIfAuthenticated } from "@/lib/auth-context";

/** A company's registration link: its clients sign up here and land in that company. */
export default function CompanySignupPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { register } = useAuth();
  const { loading } = useRedirectIfAuthenticated();

  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [account, setAccount] = useState(EMPTY_ACCOUNT);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    companiesApi
      .publicView(slug)
      .then((c) => !cancelled && setCompany(c))
      .catch((err) => {
        if (!cancelled) setCompanyError(err instanceof ApiError ? err.message : "No se pudo cargar la empresa.");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!company) return;
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await register({ ...accountPayload(account), company: company.slug });
      router.push("/login?registered=1");
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

  if (loading || (!company && !companyError)) {
    return <div className="flex-1 bg-zinc-50 dark:bg-black" />;
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
      <Card className="w-full max-w-sm">
        {company ? (
          <>
            <CardHeader>
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BusIcon className="size-4" />
                {company.name}
              </p>
              <CardTitle className="text-xl">Crear cuenta</CardTitle>
              <CardDescription>Regístrate para ver los viajes de {company.name} y reservar el tuyo.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <AccountFields values={account} onChange={setAccount} errors={fieldErrors} />

                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Creando cuenta…" : "Crear cuenta"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-medium text-foreground hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-xl">Link no válido</CardTitle>
              <CardDescription>{companyError}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Pide a tu empresa de transporte su link de registro actualizado, o{" "}
                <Link href="/login" className="font-medium text-foreground hover:underline">
                  inicia sesión
                </Link>{" "}
                si ya tienes cuenta.
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
