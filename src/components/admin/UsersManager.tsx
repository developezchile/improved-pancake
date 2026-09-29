"use client";

import { useEffect, useMemo, useState } from "react";
import { PencilIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import UserDialog from "@/components/admin/UserDialog";
import { ApiError, usersApi, type ProfileRef, type UserResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type DialogState = { open: boolean; user: UserResponse | null; key: number };

const ALL_PROFILES = "all";

/** Account administration (USERS module): administrators and clients, their profile and status. */
export default function UsersManager() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [profiles, setProfiles] = useState<ProfileRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [profileFilter, setProfileFilter] = useState<string>(ALL_PROFILES);
  const [dialog, setDialog] = useState<DialogState>({ open: false, user: null, key: 0 });

  // Bumped after every change to refetch the list.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      try {
        const [usersRes, profilesRes] = await Promise.all([usersApi.list(token), usersApi.profileOptions(token)]);
        if (cancelled) return;
        setUsers(usersRes.users);
        setProfiles(profilesRes.profiles);
        setLoadError(null);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "No se pudieron cargar los usuarios.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (profileFilter !== ALL_PROFILES && String(u.profile.id) !== profileFilter) return false;
      if (!q) return true;
      return [u.username, u.email, u.firstName, u.lastName].some((v) => v?.toLowerCase().includes(q));
    });
  }, [users, query, profileFilter]);

  const filterItems = [
    { value: ALL_PROFILES, label: "Todos los perfiles" },
    ...profiles.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  function openDialog(user: UserResponse | null) {
    setDialog((d) => ({ open: true, user, key: d.key + 1 }));
  }

  async function onSaved() {
    setDialog((d) => ({ ...d, open: false }));
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, usuario o correo"
            aria-label="Buscar usuarios"
            className="pl-8"
          />
        </div>
        <Select items={filterItems} value={profileFilter} onValueChange={(v) => setProfileFilter(v ?? ALL_PROFILES)}>
          <SelectTrigger className="w-48" aria-label="Filtrar por perfil">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => openDialog(null)} disabled={loading}>
          <PlusIcon data-icon="inline-start" />
          Nuevo usuario
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
              <TableHead className="pl-4">Usuario</TableHead>
              <TableHead>Celular</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-16 pr-4 text-right">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {users.length === 0 ? "No hay usuarios registrados" : "Ningún usuario coincide con el filtro"}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((u) => {
              const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
              return (
                <TableRow key={u.id}>
                  <TableCell className="pl-4">
                    <div className="font-medium">
                      {name || u.username}
                      {u.id === me?.id && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(tú)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {u.username} · {u.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.profile.code === "ADMIN" ? "default" : "secondary"}>{u.profile.name}</Badge>
                  </TableCell>
                  <TableCell>
                    {!u.enabled ? (
                      <Badge variant="destructive">Deshabilitado</Badge>
                    ) : !u.emailVerified ? (
                      <Badge variant="outline">Correo sin verificar</Badge>
                    ) : (
                      <Badge variant="outline">Activo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => openDialog(u)}>
                      <PencilIcon />
                      <span className="sr-only">Editar {u.username}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <UserDialog
        key={dialog.key}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        user={dialog.user}
        isSelf={dialog.user?.id === me?.id}
        profiles={profiles}
        onSaved={onSaved}
      />
    </div>
  );
}
