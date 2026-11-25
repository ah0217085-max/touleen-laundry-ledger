import { useMemo } from "react";
import { AlertCircle, MessageCircle, Phone } from "lucide-react";
import { CONTACT_NOTICES, contactLinks } from "@/lib/laundry/contact";
import { cn } from "@/lib/utils";

const btn =
  "inline-flex h-9 shrink-0 items-center gap-1 rounded-xl px-2.5 text-xs font-extrabold transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 [&_svg]:size-4";
const off = "cursor-not-allowed bg-muted text-muted-foreground/70";

interface Props {
  phone: string | null | undefined;
  customerName: string;
  className?: string;
  /** Icon-only buttons (labels stay available to screen readers), for dense tables. */
  compact?: boolean;
}

/** Customer number with one-tap call and WhatsApp buttons right beside it. */
export function ContactActions({ phone, customerName, className, compact = false }: Props) {
  const links = useMemo(() => contactLinks(phone), [phone]);
  const b = cn(btn, compact && "w-9 justify-center px-0");
  const label = compact ? "sr-only" : undefined;

  if (links.problem === "missing") {
    return (
      <div className={cn("flex items-center", className)}>
        <span className="text-xs font-semibold text-muted-foreground">بدون رقم</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1.5", className)}>
      <span className="tnum text-sm font-bold text-muted-foreground" dir="ltr">
        {phone || "—"}
      </span>
      <span className="flex items-center gap-1.5">
        {links.tel ? (
          <a
            href={links.tel}
            className={cn(b, "bg-primary text-primary-foreground hover:brightness-110")}
            aria-label={`اتصال مباشر بـ ${customerName}`}
            title="اتصال مباشر"
          >
            <Phone strokeWidth={2.6} />
            <span className={label}>اتصال</span>
          </a>
        ) : (
          <button type="button" disabled className={cn(b, off)} aria-label="اتصال مباشر غير متاح">
            <Phone strokeWidth={2.6} />
            <span className={label}>اتصال</span>
          </button>
        )}
        {links.whatsapp ? (
          <a
            href={links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(b, "bg-whatsapp text-whatsapp-foreground hover:brightness-110")}
            aria-label={`واتساب مباشر مع ${customerName}`}
            title="واتساب مباشر"
          >
            <MessageCircle strokeWidth={2.6} />
            <span className={label}>واتساب</span>
          </a>
        ) : (
          <button type="button" disabled className={cn(b, off)} aria-label="واتساب غير متاح">
            <MessageCircle strokeWidth={2.6} />
            <span className={label}>واتساب</span>
          </button>
        )}
      </span>
      {links.problem && (
        <p
          role="status"
          className="flex basis-full items-center gap-1 text-xs font-bold text-destructive"
        >
          <AlertCircle className="size-3.5 shrink-0" />
          {CONTACT_NOTICES[links.problem]}
        </p>
      )}
    </div>
  );
}
