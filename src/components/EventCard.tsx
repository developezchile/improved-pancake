import Image from "next/image";
import { BusIcon, CalendarDaysIcon, MapPinIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventResponse } from "@/lib/api";
import { formatEventDates, isOptimizableImage } from "@/lib/events";

type EventCardProps = {
  event: EventResponse;
  passengerCount: number;
  priority?: boolean;
  onTravel: () => void;
};

export default function EventCard({ event, passengerCount, priority, onTravel }: EventCardProps) {
  return (
    <Card className="pt-0">
      <div className="relative aspect-video bg-muted">
        {event.imageUrl && (
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority={priority}
            unoptimized={!isOptimizableImage(event.imageUrl)}
          />
        )}
        {event.category && (
          <span className="absolute top-2 left-2 rounded-md bg-background/90 px-2 py-0.5 text-xs font-medium">
            {event.category}
          </span>
        )}
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-2" title={event.name}>
          {event.name}
        </CardTitle>
        <CardDescription className="space-y-1">
          <span className="flex items-center gap-1.5">
            <CalendarDaysIcon className="size-3.5 shrink-0" />
            {formatEventDates(event)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="size-3.5 shrink-0" />
            {event.venue}, {event.commune}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        {passengerCount > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UsersIcon className="size-3.5 shrink-0" />
            {passengerCount === 1 ? "Tienes 1 pasajero reservado" : `Tienes ${passengerCount} pasajeros reservados`}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onTravel}>
          <BusIcon data-icon="inline-start" />
          Viajar
        </Button>
      </CardFooter>
    </Card>
  );
}
