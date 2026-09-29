"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError, companiesApi, type CompanyListing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/**
 * Every company on the platform (COMPANIES module, platform administrator only). Disabling one
 * locks out all of its accounts and its registration link; its data is kept.
 */
export default function CompaniesManager() {
  const { token, user } = useAuth();
  const [companies, setCompanies] = useState<CompanyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) return;
    companiesApi
      .list(token)
      .then((res) => !cancelled && setCompanies(res.companies))
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "No se pudieron cargar las empresas.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function setActive(company: CompanyListing, active: boolean) {
    if (!token) return;
    setError(null);
    setSavingId(company.id);
    try {
      const saved = await companiesApi.setActive(company.id, active, token);
      setCompanies((list) => list.map((c) => (c.id === saved.id ? { ...c, active: saved.active } : c)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar la empresa.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="text-right">Usuarios</TableHead>
              <TableHead className="text-right">Eventos</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead className="pr-4 text-right">Habilitada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No hay empresas registradas
                </TableCell>
              </TableRow>
            )}
            {companies.map((c) => {
              const own = c.id === user?.company.id;
              return (
                <TableRow key={c.id}>
                  <TableCell className="pl-4">
                    <div className="font-medium">
                      {c.name}
                      {own && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(tuya)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">/empresa/{c.slug}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.contactEmail ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.userCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.eventCount}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("es-CL")}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!c.active && <Badge variant="destructive">Deshabilitada</Badge>}
                      <Switch
                        checked={c.active}
                        disabled={own || savingId === c.id}
                        onCheckedChange={(checked) => setActive(c, checked)}
                        aria-label={`${c.active ? "Deshabilitar" : "Habilitar"} ${c.name}`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
