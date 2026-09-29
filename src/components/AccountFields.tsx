"use client";

import FormField from "@/components/FormField";
import type { AccountPayload } from "@/lib/api";

export type AccountValues = Required<AccountPayload>;

export const EMPTY_ACCOUNT: AccountValues = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
};

/** Blank optional fields are left out rather than sent as "". */
export function accountPayload(values: AccountValues): AccountPayload {
  return {
    username: values.username,
    email: values.email,
    password: values.password,
    firstName: values.firstName || undefined,
    lastName: values.lastName || undefined,
    phone: values.phone || undefined,
  };
}

type AccountFieldsProps = {
  values: AccountValues;
  onChange: (values: AccountValues) => void;
  errors: Record<string, string>;
};

/** The account part of both sign-up forms: a client's (through their company's link) and a new company's administrator. */
export default function AccountFields({ values, onChange, errors }: AccountFieldsProps) {
  const set = (field: keyof AccountValues) => (value: string) => onChange({ ...values, [field]: value });

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nombre" name="firstName" value={values.firstName} onChange={set("firstName")} autoComplete="given-name" />
        <FormField label="Apellido" name="lastName" value={values.lastName} onChange={set("lastName")} autoComplete="family-name" />
      </div>
      <FormField
        label="Celular (opcional)"
        name="phone"
        type="tel"
        inputMode="tel"
        placeholder="+56 9 1234 5678"
        value={values.phone}
        onChange={set("phone")}
        error={errors.phone}
        autoComplete="tel"
      />
      <FormField
        label="Nombre de usuario"
        name="username"
        value={values.username}
        onChange={set("username")}
        error={errors.username}
        required
        autoComplete="username"
      />
      <FormField
        label="Correo electrónico"
        name="email"
        type="email"
        value={values.email}
        onChange={set("email")}
        error={errors.email}
        required
        autoComplete="email"
      />
      <FormField
        label="Contraseña"
        name="password"
        type="password"
        value={values.password}
        onChange={set("password")}
        error={errors.password}
        required
        autoComplete="new-password"
      />
    </>
  );
}
