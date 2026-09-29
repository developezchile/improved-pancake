"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import FormField from "@/components/FormField";
import { ApiError, companiesApi, type CompanyResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Feedback = { kind: "success" | "error"; message: string } | null;

/** "Mi empresa" (COMPANY module): the registration link for the company's clients, and its details. */
export default function CompanySettings() {
  const { token, refreshUser } = useAuth();
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) return;
    companiesApi
      .mine(token)
      .then((c) => !cancelled && setCompany(c))
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "No se pudo cargar la empresa.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }
  if (!company) return null;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <RegistrationLink slug={company.slug} />
      <CompanyForm
        company={company}
        onSaved={(saved) => {
          setCompany(saved);
          // The header shows the company name from the session.
          refreshUser();
        }}
      />
    </div>
  );
}

function RegistrationLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/empresa/${slug}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context): the field is still selectable.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link de registro para tus clientes</CardTitle>
        <CardDescription>
          Compártelo por WhatsApp, redes o tu sitio. Quien se registre con él queda como cliente de tu empresa y solo ve
          tus viajes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Input value={link} readOnly aria-label="Link de registro" onFocus={(e) => e.target.select()} />
        <Button variant="outline" onClick={copy}>
          {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CompanyForm({ company, onSaved }: { company: CompanyResponse; onSaved: (company: CompanyResponse) => void }) {
  const { token } = useAuth();
  const [name, setName] = useState(company.name);
  const [contactEmail, setContactEmail] = useState(company.contactEmail ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setErrors({});
    setFeedback(null);
    setSaving(true);
    try {
      onSaved(await companiesApi.updateMine({ name, contactEmail: contactEmail.trim() || undefined }, token));
      setFeedback({ kind: "success", message: "Datos de la empresa actualizados." });
    } catch (err) {
      setErrors(err instanceof ApiError ? (err.fieldErrors ?? {}) : {});
      setFeedback({
        kind: "error",
        message: err instanceof ApiError ? err.message : "Ocurrió un error inesperado. Intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la empresa</CardTitle>
        <CardDescription>
          Los correos a tus clientes (verificación de cuenta, recuperar contraseña) van con este nombre, y sus respuestas
          llegan al correo de contacto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4" noValidate>
          <FormField label="Nombre" name="companyName" value={name} onChange={setName} error={errors.name} required />
          <FormField
            label="Correo de contacto"
            name="contactEmail"
            type="email"
            value={contactEmail}
            onChange={setContactEmail}
            error={errors.contactEmail}
            autoComplete="email"
          />
          {feedback && (
            <Alert
              variant={feedback.kind === "error" ? "destructive" : "default"}
              className={
                feedback.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : undefined
              }
            >
              <AlertDescription className={feedback.kind === "success" ? "text-emerald-700 dark:text-emerald-300" : undefined}>
                {feedback.message}
              </AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
