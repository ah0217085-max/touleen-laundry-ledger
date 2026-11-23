import { CURRENCY, formatNumber } from "@/lib/laundry/format";
import { cn } from "@/lib/utils";

export function Money({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("tnum font-extrabold text-accent-foreground", className)}>
      {formatNumber(value)} <span className="text-[0.75em] font-semibold text-muted-foreground">{CURRENCY}</span>
    </span>
  );
}
