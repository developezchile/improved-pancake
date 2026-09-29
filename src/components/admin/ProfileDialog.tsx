"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FormField from "@/components/FormField";
import { ApiError, type ModuleInfo, type ModuleKey, type ProfilePayload, type ProfileResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

type ProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = creating a new profile. */
  profile: ProfileResponse | null;
  modules: ModuleInfo[];
  onSave: (payload: ProfilePayload) => Promise<void>;
};

export default function ProfileDialog({ open, onOpenChange, profile, modules, onSave }: ProfileDialogProps) {
  const [name, setName] = useState(profile?.name ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [selected, setSelected] = useState<Set<ModuleKey>>(() => new Set(profile?.modules ?? []));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const modulesLocked = profile !== null && !profile.editableModules;

  function toggle(key: ModuleKey, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFieldErrors({ name: "Ingresa un nombre" });
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        // Keep catalog order so the saved list reads the same as the checkboxes.
        modules: modules.map((m) => m.key).filter((key) => selected.has(key)),
      });
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
          <DialogTitle>{profile ? "Editar perfil" : "Nuevo perfil"}</DialogTitle>
          <DialogDescription>Los usuarios con este perfil solo verán los módulos habilitados.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            label="Nombre"
            name="profile-name"
            placeholder="Ej: Coordinador de viajes"
            value={name}
            onChange={setName}
            error={fieldErrors.name}
            required
          />
          <FormField
            label="Descripción (opcional)"
            name="profile-description"
            value={description}
            onChange={setDescription}
            error={fieldErrors.description}
          />

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Módulos habilitados</legend>
            {modulesLocked && (
              <p className="text-xs text-muted-foreground">
                El perfil Administrador siempre tiene todos los módulos, para que nadie pierda acceso a este mantenedor.
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {modules.map((m) => {
                const checked = selected.has(m.key);
                return (
                  <label
                    key={m.key}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors hover:bg-muted/50",
                      checked && "border-primary/40 bg-muted/60",
                      modulesLocked && "cursor-not-allowed opacity-70"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={modulesLocked}
                      onCheckedChange={(value) => toggle(m.key, value)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-medium">{m.label}</span>
                      <span className="block text-xs text-muted-foreground">{m.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {fieldErrors.modules && <p className="text-xs text-destructive">{fieldErrors.modules}</p>}
          </fieldset>

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
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
