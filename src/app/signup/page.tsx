"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FormField from "@/components/FormField";
import { ApiError } from "@/lib/api";
import { useAuth, useRedirectIfAuthenticated } from "@/lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { loading } = useRedirectIfAuthenticated();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await register({
        username,
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
      });
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

  if (loading) {
    return <div className="flex-1 bg-zinc-50 dark:bg-black" />;
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Crear cuenta</CardTitle>
          <CardDescription>Regístrate para ver eventos y reservar tu viaje en bus.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Nombre"
                name="firstName"
                value={firstName}
                onChange={setFirstName}
                autoComplete="given-name"
              />
              <FormField
                label="Apellido"
                name="lastName"
                value={lastName}
                onChange={setLastName}
                autoComplete="family-name"
              />
            </div>
            <FormField
              label="Celular (opcional)"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="+56 9 1234 5678"
              value={phone}
              onChange={setPhone}
              error={fieldErrors.phone}
              autoComplete="tel"
            />
            <FormField
              label="Nombre de usuario"
              name="username"
              value={username}
              onChange={setUsername}
              error={fieldErrors.username}
              required
              autoComplete="username"
            />
            <FormField
              label="Correo electrónico"
              name="email"
              type="email"
              value={email}
              onChange={setEmail}
              error={fieldErrors.email}
              required
              autoComplete="email"
            />
            <FormField
              label="Contraseña"
              name="password"
              type="password"
              value={password}
              onChange={setPassword}
              error={fieldErrors.password}
              required
              autoComplete="new-password"
            />

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
      </Card>
    </div>
  );
}
