"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import FormField from "@/components/FormField";
import { ApiError, settingsApi, type SmtpSettingsResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Feedback = { kind: "success" | "error"; message: string } | null;

/** SMTP provider (e.g. Maileroo) editable at runtime — doscolas' Email Settings tab, as a module. */
export default function SmtpSettingsForm() {
  const { token, user } = useAuth();
  const [settings, setSettings] = useState<SmtpSettingsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      try {
        const res = await settingsApi.smtp(token);
        if (!cancelled) setSettings(res);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "No se pudo cargar la configuración.");
      }
    }

    load();
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
  if (!settings) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  // Keyed on updatedAt so the form re-initializes from what the server saved.
  return (
    <SmtpForm
      key={settings.updatedAt ?? "new"}
      settings={settings}
      defaultTestTo={user?.email ?? ""}
      onSaved={setSettings}
    />
  );
}

function SmtpForm({
  settings,
  defaultTestTo,
  onSaved,
}: {
  settings: SmtpSettingsResponse;
  defaultTestTo: string;
  onSaved: (settings: SmtpSettingsResponse) => void;
}) {
  const { token } = useAuth();
  const [provider, setProvider] = useState(settings.provider ?? "");
  const [host, setHost] = useState(settings.host ?? "");
  const [port, setPort] = useState(settings.port ? String(settings.port) : "587");
  const [username, setUsername] = useState(settings.username ?? "");
  const [password, setPassword] = useState("");
  const [startTls, setStartTls] = useState(settings.startTls);
  const [fromAddress, setFromAddress] = useState(settings.fromAddress ?? "");
  const [fromName, setFromName] = useState(settings.fromName ?? "Viajes a Eventos");
  const [enabled, setEnabled] = useState(settings.enabled);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveFeedback, setSaveFeedback] = useState<Feedback>(null);
  const [saving, setSaving] = useState(false);

  const [testTo, setTestTo] = useState(defaultTestTo);
  const [testFeedback, setTestFeedback] = useState<Feedback>(null);
  const [testing, setTesting] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFieldErrors({});
    setSaveFeedback(null);
    const portNumber = port.trim() ? Number(port) : undefined;
    if (portNumber !== undefined && !Number.isInteger(portNumber)) {
      setFieldErrors({ port: "Ingresa un número" });
      return;
    }
    setSaving(true);
    try {
      const saved = await settingsApi.saveSmtp(
        {
          provider: provider.trim() || undefined,
          host: host.trim() || undefined,
          port: portNumber,
          username: username.trim() || undefined,
          password: password || undefined,
          startTls,
          fromAddress: fromAddress.trim() || undefined,
          fromName: fromName.trim() || undefined,
          enabled,
        },
        token
      );
      onSaved(saved);
    } catch (err) {
      setFieldErrors(err instanceof ApiError ? (err.fieldErrors ?? {}) : {});
      setSaveFeedback({ kind: "error", message: err instanceof ApiError ? err.message : "Ocurrió un error inesperado." });
    } finally {
      setSaving(false);
    }
  }

  async function sendTest(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setTestFeedback(null);
    setTesting(true);
    try {
      const res = await settingsApi.testSmtp(testTo, token);
      setTestFeedback({ kind: "success", message: res.message });
    } catch (err) {
      setTestFeedback({ kind: "error", message: err instanceof ApiError ? err.message : "Ocurrió un error inesperado." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
      <Card>
        <CardHeader>
          <CardTitle>Servidor SMTP</CardTitle>
          <CardDescription>
            {settings.active
              ? "Los correos se envían con esta configuración."
              : settings.fallback
                ? `Mientras esta configuración no esté habilitada, los correos salen por el servidor configurado en la API (${settings.fallback}).`
                : "Mientras esta configuración no esté habilitada, los correos solo se escriben en el log de la API."}
          </CardDescription>
          <CardAction>
            {settings.active ? <Badge>En uso</Badge> : <Badge variant="outline">Sin usar</Badge>}
          </CardAction>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4" noValidate>
            <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
              <FormField label="Servidor" name="smtp-host" placeholder="smtp.maileroo.com" value={host} onChange={setHost} error={fieldErrors.host} />
              <FormField label="Puerto" name="smtp-port" inputMode="numeric" value={port} onChange={setPort} error={fieldErrors.port} />
            </div>
            <FormField label="Proveedor (opcional)" name="smtp-provider" placeholder="Maileroo" value={provider} onChange={setProvider} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Usuario" name="smtp-username" value={username} onChange={setUsername} autoComplete="off" />
              <FormField
                label="Contraseña"
                name="smtp-password"
                type="password"
                placeholder={settings.passwordSet ? "Guardada — dejar en blanco para mantenerla" : ""}
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Correo remitente"
                name="smtp-from-address"
                type="email"
                placeholder="no-reply@tudominio.cl"
                value={fromAddress}
                onChange={setFromAddress}
                error={fieldErrors.fromAddress}
              />
              <FormField label="Nombre remitente" name="smtp-from-name" value={fromName} onChange={setFromName} error={fieldErrors.fromName} />
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="smtp-starttls">Usar STARTTLS</Label>
                <Switch id="smtp-starttls" checked={startTls} onCheckedChange={setStartTls} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="smtp-enabled">Habilitar esta configuración</Label>
                  <p className="text-xs text-muted-foreground">Envía una prueba antes de habilitarla.</p>
                </div>
                <Switch id="smtp-enabled" checked={enabled} onCheckedChange={setEnabled} />
              </div>
            </div>

            {saveFeedback && (
              <Alert variant="destructive">
                <AlertDescription>{saveFeedback.message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Correo de prueba</CardTitle>
          <CardDescription>Usa la configuración guardada, aunque todavía no esté habilitada.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendTest} className="space-y-3" noValidate>
            <FormField label="Enviar a" name="smtp-test-to" type="email" value={testTo} onChange={setTestTo} />
            {testFeedback && (
              <Alert
                variant={testFeedback.kind === "error" ? "destructive" : "default"}
                className={
                  testFeedback.kind === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : undefined
                }
              >
                <AlertDescription className={testFeedback.kind === "success" ? "text-emerald-700 dark:text-emerald-300" : undefined}>
                  {testFeedback.message}
                </AlertDescription>
              </Alert>
            )}
            <Button type="submit" variant="outline" disabled={testing || !settings.configured} className="w-full">
              {testing ? "Enviando…" : "Enviar prueba"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
