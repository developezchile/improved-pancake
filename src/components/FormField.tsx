import type { HTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
};

export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  required,
  autoComplete,
  placeholder,
  inputMode,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={!!error}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
