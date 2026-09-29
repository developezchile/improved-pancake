import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/lib/api";

export default function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return status === "CONFIRMED" ? (
    <Badge variant="secondary">Confirmada</Badge>
  ) : (
    <Badge variant="destructive">Cancelada</Badge>
  );
}
