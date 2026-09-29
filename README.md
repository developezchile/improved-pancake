# Viajes a eventos

Front end para gestionar viajes en bus a eventos fuera de la ciudad.

Stack: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui (base-nova sobre Base UI) y lucide-react.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Necesita la API corriendo (`../api`, por defecto en `http://localhost:8080/api`; se cambia con
`NEXT_PUBLIC_API_URL` en `.env.local`).

## Estado actual

- **Login y registro:** inicio de sesión, registro con verificación de correo, recuperar y restablecer contraseña, y "Mi perfil" (datos de contacto y cambio de contraseña).
- **Módulos por perfil:** la navegación (`src/lib/modules.ts`) muestra solo los módulos que habilita el perfil del usuario, y cada página se protege con `useRequireModule`. La API aplica la misma regla.
  - **Eventos** (`EVENTS`): lista los eventos próximos desde la API. El botón "Viajar" abre un modal para registrar uno o más pasajeros; el primero viene prellenado con los datos de la sesión, y la reserva se guarda en la API. Desde "Mis reservas" se ven las reservas propias y se pueden cancelar.
  - **Reservas** (`BOOKINGS`): vista del operador con todos los pasajeros, filtro por evento y total por punto y hora de salida.
  - **Usuarios** (`USERS`): administradores y clientes. Permite crear cuentas, asignar un perfil y habilitar o deshabilitar.
  - **Perfiles** (`PROFILES`): mantenedor de perfiles, donde se habilitan los módulos de cada uno.
