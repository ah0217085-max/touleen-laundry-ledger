import { formatNumber } from "@/lib/laundry/format";
import type { SectionSummary } from "@/lib/laundry/records";

interface Props {
  summary: SectionSummary;
  showPieces?: boolean;
  filtered?: boolean;
}

/** Compact, high-clarity summary strip for the active section updating live with search and filters. */
export function SectionSummaryStrip({ summary, showPieces = false, filtered = false }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="glass mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl px-3.5 py-2.5 text-xs font-bold sm:text-[13px]"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-foreground">
          {filtered ? "المعروض:" : "الإجمالي:"}{" "}
          <span className="tnum font-extrabold">{formatNumber(summary.total)}</span>
        </span>
        {showPieces && (
          <span className="text-muted-foreground">
            القطع:{" "}
            <span className="tnum font-extrabold text-foreground">
              {formatNumber(summary.pieces)}
            </span>
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 text-pending-foreground">
          <span aria-hidden="true" className="size-2 rounded-full bg-pending" />
          غير مُسلّم: <span className="tnum font-extrabold">{formatNumber(summary.pending)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-success-foreground">
          <span aria-hidden="true" className="size-2 rounded-full bg-success" />
          تم التسليم: <span className="tnum font-extrabold">{formatNumber(summary.delivered)}</span>
        </span>
      </div>
    </div>
  );
}
