import type { Metadata } from "next";
import { BusIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PublicEventCard from "@/components/public/PublicEventCard";
import PublicShell from "@/components/public/PublicShell";
import { publicApi, type PublicCatalog } from "@/lib/api";
import { absoluteUrl, listCommunes, realCommunes } from "@/lib/site";

/**
 * The public catalog, server-rendered: the page somebody lands on from a search, and until now the
 * thing this product didn't have. Everything a crawler needs is in the HTML — event names, venues,
 * dates, the communes the buses leave from and the price.
 */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await loadCatalog();
  if (!catalog) return { title: "Viajes en bus a eventos" };

  const communes = listCommunes(realCommunes(dedupe(catalog.events.flatMap((e) => e.originCommunes))));
  const title = communes
    ? `Viajes en bus a eventos desde ${communes}`
    : "Viajes en bus a eventos";
  const description = catalog.events.length
    ? `${catalog.company.name} lleva en bus a ${catalog.events
        .slice(0, 3)
        .map((e) => e.name)
        .join(", ")} y más. Ida y vuelta, con punto de encuentro y hora.`
    : `${catalog.company.name}: viajes en bus a eventos fuera de la ciudad.`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl("/") },
    openGraph: { title, description, url: absoluteUrl("/"), type: "website" },
  };
}

export default async function HomePage() {
  const catalog = await loadCatalog();

  if (!catalog) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-16 sm:px-8">
        <Alert>
          <AlertDescription>
            Todavía no hay un catálogo publicado. Si administras este sitio, crea un evento y publica una salida.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <PublicShell company={catalog.company}>
      <div className="mb-8">
        {/* Sin comuna de origen: el catálogo son los eventos, y de dónde sale cada bus es un dato
            de cada salida. Con un solo origen cargado el título decía "desde Rancagua" y parecía
            que la empresa solo va desde ahí. */}
        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          Viajes en bus a eventos
        </h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          {catalog.company.name} te lleva y te trae. Elige el evento, mira desde dónde sale el bus y a qué hora, y
          reserva tu asiento.
        </p>
      </div>

      {catalog.events.length === 0 ? (
        <p className="flex items-center justify-center gap-2 py-16 text-center text-muted-foreground">
          <BusIcon className="size-4" />
          No hay salidas publicadas por ahora. Vuelve pronto.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.events.map((event, index) => (
            <PublicEventCard key={event.id} event={event} ratings={catalog.ratings} priority={index < 3} />
          ))}
        </div>
      )}
    </PublicShell>
  );
}

/**
 * Null when there's nothing published — a fresh install, or the company disabled. The page says so
 * instead of crashing, because this is the one URL a visitor is guaranteed to try.
 */
async function loadCatalog(): Promise<PublicCatalog | null> {
  try {
    return await publicApi.catalog();
  } catch {
    return null;
  }
}

function dedupe(values: string[]) {
  return [...new Set(values)];
}
