"use client";

import AppShell from "@/components/AppShell";
import PageSkeleton from "@/components/PageSkeleton";
import SmtpSettingsForm from "@/components/admin/SmtpSettingsForm";
import { useRequireModule } from "@/lib/auth-context";

export default function SettingsPage() {
  const { ready } = useRequireModule("SETTINGS");
  if (!ready) return <PageSkeleton />;

  return (
    <AppShell title="Configuración" description="Servidor de correo para verificación de cuentas y recuperación de contraseña.">
      <SmtpSettingsForm />
    </AppShell>
  );
}
