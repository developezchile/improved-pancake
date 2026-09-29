"use client";

import { useEffect, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ProfileDialog from "@/components/admin/ProfileDialog";
import { ApiError, profilesApi, type ModuleInfo, type ProfilePayload, type ProfileResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type DialogState = { open: boolean; profile: ProfileResponse | null; key: number };

/** Profile maintainer (PROFILES module) — condominios' ProfileManager, on this stack. */
export default function ProfilesManager() {
  const { token, user, refreshUser } = useAuth();
  const [profiles, setProfiles] = useState<ProfileResponse[]>([]);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ open: false, profile: null, key: 0 });
  const [toDelete, setToDelete] = useState<ProfileResponse | null>(null);

  // Bumped after every change to refetch the list.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      try {
        const [profilesRes, modulesRes] = await Promise.all([profilesApi.list(token), profilesApi.modules(token)]);
        if (cancelled) return;
        setProfiles(profilesRes.profiles);
        setModules(modulesRes.modules);
        setLoadError(null);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "No se pudieron cargar los perfiles.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, refreshKey]);

  function openDialog(profile: ProfileResponse | null) {
    setDialog((d) => ({ open: true, profile, key: d.key + 1 }));
  }

  async function save(payload: ProfilePayload) {
    if (!token) return;
    if (dialog.profile) {
      await profilesApi.update(dialog.profile.id, payload, token);
      // Editing your own profile changes what you can see — pick it up right away.
      if (dialog.profile.id === user?.profile.id) await refreshUser();
    } else {
      await profilesApi.create(payload, token);
    }
    setDialog((d) => ({ ...d, open: false }));
    setRefreshKey((k) => k + 1);
  }

  async function confirmDelete() {
    if (!token || !toDelete) return;
    await profilesApi.remove(toDelete.id, token);
    setToDelete(null);
    setRefreshKey((k) => k + 1);
  }

  const moduleLabel = (key: string) => modules.find((m) => m.key === key)?.label ?? key;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {loading ? "Cargando…" : `${profiles.length} perfiles configurados`}
        </p>
        <Button onClick={() => openDialog(null)} disabled={loading}>
          <PlusIcon data-icon="inline-start" />
          Nuevo perfil
        </Button>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Nombre</TableHead>
              <TableHead>Módulos habilitados</TableHead>
              <TableHead className="text-right">Usuarios</TableHead>
              <TableHead className="w-24 pr-4 text-right">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && profiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No hay perfiles registrados
                </TableCell>
              </TableRow>
            )}
            {profiles.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4 align-top whitespace-normal">
                  <div className="flex items-center gap-2 font-medium">
                    {p.name}
                    {p.system && <Badge variant="outline">Sistema</Badge>}
                  </div>
                  {p.description && <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>}
                </TableCell>
                <TableCell className="align-top whitespace-normal">
                  <div className="flex flex-wrap gap-1">
                    {p.modules.length > 0 ? (
                      p.modules.map((m) => (
                        <Badge key={m} variant="secondary">
                          {moduleLabel(m)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Sin módulos</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right align-top tabular-nums">{p.userCount}</TableCell>
                <TableCell className="pr-4 text-right align-top">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openDialog(p)}>
                      <PencilIcon />
                      <span className="sr-only">Editar {p.name}</span>
                    </Button>
                    {p.deletable && (
                      <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(p)}>
                        <Trash2Icon />
                        <span className="sr-only">Eliminar {p.name}</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ProfileDialog
        key={dialog.key}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        profile={dialog.profile}
        modules={modules}
        onSave={save}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Eliminar perfil"
        description={
          toDelete?.userCount
            ? `"${toDelete.name}" tiene ${toDelete.userCount} usuario(s). Asígnales otro perfil antes de eliminarlo.`
            : `¿Eliminar el perfil "${toDelete?.name}"? Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
