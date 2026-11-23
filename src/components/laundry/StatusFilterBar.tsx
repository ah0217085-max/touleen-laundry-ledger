import { CheckCircle2, Clock, LayoutGrid } from "lucide-react";
import type { StatusFilter } from "@/lib/laundry/types";
import { formatNumber } from "@/lib/laundry/format";

const FILTERS = [
  { key: "all", label: "الكل", icon: LayoutGrid },
  { key: "pending", label: "غير مُسلّم", icon: Clock },
  { key: "delivered", label: "تم التسليم", icon: CheckCircle2 },
] as const;

interface Props {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
}

export function StatusFilterBar({ value, onChange, counts }: Props) {
  return (
    <div role="tablist" aria-label="تصفية حسب حالة التسليم" className="glass grid grid-cols-3 gap-1 rounded-2xl p-1">
      {FILTERS.map(({ key, label, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={
              "flex min-h-11 items-center justify-center gap-1 rounded-xl px-1.5 text-[13px] font-bold transition-all sm:gap-1.5 sm:px-2 sm:text-sm " +
              (active ? "bg-brand shadow-glow" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")
            }
          >
            <Icon className="hidden size-4 shrink-0 sm:block" strokeWidth={2.4} />
            <span className="whitespace-nowrap">{label}</span>
            <span
              className={
                "tnum rounded-full px-1.5 text-xs " +
                (active ? "bg-primary-foreground/25" : "bg-accent text-accent-foreground")
              }
            >
              {formatNumber(counts[key])}
            </span>
          </button>
        );
      })}
    </div>
  );
}
