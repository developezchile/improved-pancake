"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FormField from "@/components/FormField";
import { ApiError, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { MODULE_LABELS } from "@/lib/modules";

type Feedback = { kind: "success" | "error"; message: string } | null;

export default function MyAccount() {
  const { user, token, setUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [dataErrors, setDataErrors] = useState<Record<string, string>>({});
  const [dataFeedback, setDataFeedback] = useState<Feedback>(null);
  const [savingData, setSavingData] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user || !token) return null;

  async function saveData(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setDataErrors({});
    setDataFeedback(null);
    setSavingData(true);
    try {
      setUser(await authApi.updateMe({ firstName, lastName, phone }, token));
      setDataFeedback({ kind: "success", message: "Datos actualizados." });
    } catch (err) {
      setDataErrors(err instanceof ApiError ? (err.fieldErrors ?? {}) : {});
      setDataFeedback({ kind: "error", message: errorMessage(err) });
    } finally {
      setSavingData(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPasswordErrors({});
    setPasswordFeedback(null);
    setSavingPassword(true);
    try {
      const res = await authApi.changePassword({ currentPassword, newPassword }, token);
      setCurrentPassword("");
      setNewPassword("");
      setPasswordFeedback({ kind: "success", message: res.message });
    } catch (err) {
      setPasswordErrors(err instanceof ApiError ? (err.fieldErrors ?? {}) : {});
      setPasswordFeedback({ kind: "error", message: errorMessage(err) });
    } finally {
      setSavingPassword(false);
    }
  }

  const moduleLabels = user.modules.map((m) => MODULE_LABELS[m]);
  // An administrator's access isn't assigned by anyone else, so the card doesn't apply to them.
  const showAccessProfile = user.profile.code !== "ADMIN";

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
          <CardDescription>
            {user.username} · {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveData} className="space-y-4" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Nombre" name="firstName" value={firstName} onChange={setFirstName} error={dataErrors.firstName} autoComplete="given-name" />
              <FormField label="Apellido" name="lastName" value={lastName} onChange={setLastName} error={dataErrors.lastName} autoComplete="family-name" />
            </div>
            <FormField
              label="Celular"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="+56 9 1234 5678"
              value={phone}
              onChange={setPhone}
              error={dataErrors.phone}
              autoComplete="tel"
            />
            <FeedbackAlert feedback={dataFeedback} />
            <Button type="submit" disabled={savingData}>
              {savingData ? "Guardando…" : "Guardar cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {showAccessProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Perfil de acceso</CardTitle>
              <CardDescription>Lo asigna un administrador y define qué módulos puedes usar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{user.profile.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {moduleLabels.length > 0 ? (
                  moduleLabels.map((label) => (
                    <Badge key={label} variant="secondary">
                      {label}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">Sin módulos habilitados</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePassword} className="space-y-4" noValidate>
              <FormField
                label="Contraseña actual"
                name="currentPassword"
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
                error={passwordErrors.currentPassword}
                autoComplete="current-password"
              />
              <FormField
                label="Nueva contraseña"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                error={passwordErrors.newPassword}
                autoComplete="new-password"
              />
              <FeedbackAlert feedback={passwordFeedback} />
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? "Guardando…" : "Cambiar contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeedbackAlert({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
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
  );
}

function errorMessage(err: unknown) {
  return err instanceof ApiError ? err.message : "Ocurrió un error inesperado. Intenta nuevamente.";
}
