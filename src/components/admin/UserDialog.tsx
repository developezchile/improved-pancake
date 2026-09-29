"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import FormField from "@/components/FormField";
import { ApiError, usersApi, type ProfileRef, type UserResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type UserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = creating a new account. */
  user: UserResponse | null;
  isSelf: boolean;
  profiles: ProfileRef[];
  onSaved: () => Promise<void>;
};

export default function UserDialog({ open, onOpenChange, user, isSelf, profiles, onSaved }: UserDialogProps) {
  const { token } = useAuth();
  const creating = user === null;
  const defaultProfileId = user?.profile.id ?? profiles.find((p) => p.code === "CLIENT")?.id ?? profiles[0]?.id;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [profileId, setProfileId] = useState<string>(defaultProfileId ? String(defaultProfileId) : "");
  const [enabled, setEnabled] = useState(user?.enabled ?? true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [verification, setVerification] = useState<{ busy: boolean; message: string | null; error: boolean }>({
    busy: false,
    message: null,
    error: false,
  });

  const profileItems = profiles.map((p) => ({ value: String(p.id), label: p.name }));

  async function verifyEmail() {
    if (!token || !user) return;
    setVerification({ busy: true, message: null, error: false });
    try {
      await usersApi.verifyEmail(user.id, token);
      await onSaved();
    } catch (err) {
      setVerification({ busy: false, message: err instanceof ApiError ? err.message : "Ocurrió un error inesperado.", error: true });
    }
  }

  async function resendVerification() {
    if (!token || !user) return;
    setVerification({ busy: true, message: null, error: false });
    try {
      const res = await usersApi.resendVerification(user.id, token);
      setVerification({ busy: false, message: res.message, error: false });
    } catch (err) {
      setVerification({ busy: false, message: err instanceof ApiError ? err.message : "Ocurrió un error inesperado.", error: true });
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!profileId) {
      setFieldErrors({ profileId: "Selecciona un perfil" });
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSaving(true);
    const contact = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
    };
    try {
      if (creating) {
        await usersApi.create({ username, email, password, ...contact, profileId: Number(profileId) }, token);
      } else {
        await usersApi.update(user.id, { ...contact, profileId: Number(profileId), enabled }, token);
      }
      await onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors ?? {});
        setFormError(err.message);
      } else {
        setFormError("Ocurrió un error inesperado.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{creating ? "Nuevo usuario" : "Editar usuario"}</DialogTitle>
          <DialogDescription>
            {creating
              ? "La cuenta queda verificada y lista para iniciar sesión."
              : `${user.username} · ${user.email}`}
          </DialogDescription>
        </DialogHeader>

        {!creating && !user.emailVerified && (
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            <p className="font-medium">Correo sin verificar</p>
            <p className="text-xs">Esta cuenta no puede iniciar sesión hasta que el correo esté verificado.</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={verifyEmail} disabled={verification.busy}>
                Marcar como verificado
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={resendVerification} disabled={verification.busy}>
                Reenviar enlace
              </Button>
            </div>
            {verification.message && (
              <p className={verification.error ? "text-xs text-destructive" : "text-xs"}>{verification.message}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {creating && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label="Nombre de usuario"
                  name="new-username"
                  value={username}
                  onChange={setUsername}
                  error={fieldErrors.username}
                  required
                  autoComplete="off"
                />
                <FormField
                  label="Correo electrónico"
                  name="new-email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  error={fieldErrors.email}
                  required
                  autoComplete="off"
                />
              </div>
              <FormField
                label="Contraseña inicial"
                name="new-password"
                type="password"
                value={password}
                onChange={setPassword}
                error={fieldErrors.password}
                required
                autoComplete="new-password"
              />
            </>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Nombre" name="user-first-name" value={firstName} onChange={setFirstName} error={fieldErrors.firstName} />
            <FormField label="Apellido" name="user-last-name" value={lastName} onChange={setLastName} error={fieldErrors.lastName} />
          </div>
          <FormField
            label="Celular"
            name="user-phone"
            type="tel"
            inputMode="tel"
            placeholder="+56 9 1234 5678"
            value={phone}
            onChange={setPhone}
            error={fieldErrors.phone}
          />

          <div className="space-y-1.5">
            <Label htmlFor="user-profile">Perfil</Label>
            <Select items={profileItems} value={profileId} onValueChange={(v) => setProfileId(v ?? "")} disabled={isSelf}>
              <SelectTrigger id="user-profile" className="w-full" aria-invalid={!!fieldErrors.profileId}>
                <SelectValue placeholder="Selecciona un perfil" />
              </SelectTrigger>
              <SelectContent>
                {profileItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSelf && <p className="text-xs text-muted-foreground">No puedes cambiar tu propio perfil.</p>}
            {fieldErrors.profileId && <p className="text-xs text-destructive">{fieldErrors.profileId}</p>}
          </div>

          {!creating && (
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div>
                <Label htmlFor="user-enabled">Cuenta habilitada</Label>
                <p className="text-xs text-muted-foreground">
                  {isSelf ? "No puedes deshabilitar tu propia cuenta." : "Una cuenta deshabilitada pierde el acceso de inmediato."}
                </p>
              </div>
              <Switch id="user-enabled" checked={enabled} onCheckedChange={setEnabled} disabled={isSelf} />
            </div>
          )}

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : creating ? "Crear usuario" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
