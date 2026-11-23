import { CheckCheck } from "lucide-react";
import { formatDateTime } from "@/lib/laundry/format";

/** Shows when a record was marked «تم التسليم»; renders a dash while undelivered. */
export function DeliveredStamp({ isDelivered, deliveredAt }: { isDelivered: boolean; deliveredAt: string | null }) {
  if (!isDelivered) return <span className="font-semibold text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1 font-bold text-success-foreground">
      <CheckCheck className="size-3.5 shrink-0" />
      {formatDateTime(deliveredAt)}
    </span>
  );
}
