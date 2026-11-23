import { Check, Clock } from "lucide-react";
import { toast } from "sonner";

interface Props {
  isDelivered: boolean;
  customerName: string;
  onToggle: () => void;
}

/** One-tap delivery status button; tapping again undoes a mistaken tap. */
export function DeliveryToggle({ isDelivered, customerName, onToggle }: Props) {
  const handle = () => {
    onToggle();
    if (isDelivered) toast("أُعيد الطلب إلى «غير مُسلّم»", { description: customerName });
    else toast.success("تم التسليم ✓", { description: customerName });
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={isDelivered}
      title={isDelivered ? "تم التسليم — اضغط للتراجع" : "اضغط لتحديد «تم التسليم»"}
      className={
        "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold ring-1 transition-all active:scale-95 " +
        (isDelivered
          ? "bg-success-soft text-success-foreground ring-success/40 hover:ring-success"
          : "bg-pending-soft text-pending-foreground ring-pending/40 hover:ring-pending")
      }
    >
      {isDelivered ? (
        <Check key="d" className="pop-check size-4" strokeWidth={3} />
      ) : (
        <Clock key="p" className="size-4" strokeWidth={2.5} />
      )}
      {isDelivered ? "تم التسليم" : "غير مُسلّم"}
    </button>
  );
}
