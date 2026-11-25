import { CURRENCY, formatNumber } from "@/lib/laundry/format";
import { cn } from "@/lib/utils";

export function Money({
  value,
  className,
  showUnset = false,
}: {
  value: number | null | undefined;
  className?: string;
  showUnset?: boolean;
}) {
  const safe = typeof value === "number" && Number.isFinite(value) ? value : null;
  if (showUnset && (safe === null || safe <= 0)) {
    return (
      <span className={cn("text-sm font-semibold text-muted-foreground", className)}>غير محدد</span>
    );
  }
  return (
    <span className={cn("tnum font-extrabold text-accent-foreground", className)}>
      {formatNumber(safe ?? 0)}{" "}
      <span className="text-[0.75em] font-semibold text-muted-foreground">{CURRENCY}</span>
    </span>
  );
}
