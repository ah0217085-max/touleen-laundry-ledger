import { useMemo, useState, type ReactNode } from "react";
import {
  ChartColumn,
  CheckCircle2,
  Clock,
  HandCoins,
  LayoutGrid,
  PackageCheck,
  PackageOpen,
  Sigma,
} from "lucide-react";
import {
  computeScopedStats,
  STATS_SCOPES,
  type ScopedStats,
  type SectionStat,
  type StatsScope,
} from "@/lib/laundry/stats";
import type { StatusFilter } from "@/lib/laundry/types";
import { SECTION_LABELS } from "@/lib/laundry/sections";
import { useLaundry } from "@/lib/laundry/store";
import { formatNumber } from "@/lib/laundry/format";
import { cn } from "@/lib/utils";
import { SECTION_ICONS } from "./icons";
import { SectionHeader } from "./SectionHeader";
import { Money } from "./Money";

type Tone = "pending" | "success" | "brand";

const TONE_ICON: Record<Tone, string> = {
  pending: "bg-pending-soft text-pending-foreground",
  success: "bg-success-soft text-success-foreground",
  brand: "bg-accent text-accent-foreground",
};

function Kpi({
  icon,
  label,
  children,
  tone,
  hint,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  tone: Tone;
  hint?: string | undefined;
}) {
  return (
    <div className="glass min-w-0 rounded-3xl p-3.5 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-2.5">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-2xl sm:size-10 [&_svg]:size-4.5 sm:[&_svg]:size-5",
            TONE_ICON[tone],
          )}
        >
          {icon}
        </span>
        <p className="min-w-0 text-xs font-bold leading-snug text-foreground sm:text-sm">{label}</p>
      </div>
      <div className="mt-2.5 min-w-0 break-words text-lg sm:mt-3 sm:text-2xl">{children}</div>
      {hint && (
        <p className="mt-1 text-[11px] font-semibold leading-snug text-muted-foreground sm:text-xs">
          {hint}
        </p>
      )}
    </div>
  );
}

function Count({ value, unit }: { value: number; unit: string }) {
  return (
    <span className="tnum font-extrabold text-foreground">
      {formatNumber(value)}{" "}
      <span className="text-xs font-semibold text-muted-foreground sm:text-sm">{unit}</span>
    </span>
  );
}

function SectionCard({ s }: { s: SectionStat }) {
  const Icon = SECTION_ICONS[s.key];
  const unit = s.unit === "piece" ? "قطعة" : "طلب";
  const total = s.pendingCount + s.deliveredCount;
  const pct = total === 0 ? 0 : Math.round((s.deliveredCount / total) * 100);
  return (
    <article className="glass min-w-0 rounded-3xl p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
        <h4 className="min-w-0 flex-1 truncate text-base font-extrabold text-foreground">
          {s.label}
        </h4>
        <span className="tnum shrink-0 text-xs font-bold text-muted-foreground">
          {formatNumber(s.records)} سجل
        </span>
      </div>

      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-pending-soft"
        aria-label={`نسبة التسليم ${pct}%`}
      >
        <div
          className="h-full rounded-full bg-success transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div className="min-w-0">
          <dt className="text-xs font-semibold text-muted-foreground">غير مُسلّم</dt>
          <dd className="tnum truncate font-extrabold text-pending-foreground">
            {formatNumber(s.pendingCount)} {unit}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold text-muted-foreground">تم التسليم</dt>
          <dd className="tnum truncate font-extrabold text-success-foreground">
            {formatNumber(s.deliveredCount)} {unit}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold text-muted-foreground">مستحق</dt>
          <dd className="min-w-0 break-words">
            <Money value={s.pendingRevenue} />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold text-muted-foreground">محصّل</dt>
          <dd className="min-w-0 break-words">
            <Money value={s.deliveredRevenue} />
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-glass-strong px-3 py-2 text-sm">
        <span className="font-bold text-muted-foreground">إجمالي القيمة</span>
        <Money value={s.totalRevenue} />
      </div>
    </article>
  );
}

const UNIT_LABEL: Record<ScopedStats["unit"], string> = {
  mixed: "قطعة / طلب",
  piece: "قطعة",
  order: "طلب",
};

const STATUS_FILTERS: ReadonlyArray<{ key: StatusFilter; label: string; icon: typeof LayoutGrid }> =
  [
    { key: "all", label: "الكل", icon: LayoutGrid },
    { key: "pending", label: "غير مُسلّم", icon: Clock },
    { key: "delivered", label: "تم التسليم", icon: CheckCircle2 },
  ];

function ScopePicker({
  value,
  onChange,
}: {
  value: StatsScope;
  onChange: (v: StatsScope) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="عرض الإحصائيات حسب القسم"
      className="glass mb-2.5 grid grid-cols-3 gap-1 rounded-2xl p-1"
    >
      {STATS_SCOPES.map((key) => {
        const Icon = key === "all" ? LayoutGrid : SECTION_ICONS[key];
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={cn(
              "flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-xl px-1.5 py-1.5 text-center text-[11px] font-extrabold leading-tight transition-all sm:gap-1.5 sm:text-sm",
              active
                ? "bg-brand shadow-glow"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={2.4} />
            <span className="text-balance">
              {key === "all" ? "جميع الأقسام" : SECTION_LABELS[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StatusPicker({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="تصفية الإحصائيات حسب حالة التسليم"
      className="glass mb-3 grid grid-cols-3 gap-1 rounded-2xl p-1"
    >
      {STATUS_FILTERS.map(({ key, label, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={cn(
              "flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-extrabold transition-all sm:text-sm",
              active
                ? "bg-brand shadow-glow"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="hidden size-4 shrink-0 sm:block" strokeWidth={2.4} />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function StatsDashboard() {
  const state = useLaundry();
  const [scope, setScope] = useState<StatsScope>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const stats = useMemo(
    () => computeScopedStats(state.inventory, state.services, scope, statusFilter),
    [state.inventory, state.services, scope, statusFilter],
  );

  const unit = UNIT_LABEL[stats.unit];
  const scopeName = scope === "all" ? "جميع الأقسام" : `قسم ${SECTION_LABELS[scope]}`;
  const statusSuffix =
    statusFilter === "pending"
      ? " — غير المُسلّمة"
      : statusFilter === "delivered"
        ? " — المُسلّمة"
        : "";

  return (
    <section>
      <SectionHeader
        title="الإحصائيات"
        subtitle="أرقام لحظية محسوبة من السجلات الحالية"
        icon={<ChartColumn />}
      />
      <ScopePicker value={scope} onChange={setScope} />
      <StatusPicker value={statusFilter} onChange={setStatusFilter} />

      {!state.ready ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass h-32 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="bg-total mb-3 rounded-3xl p-4 shadow-glow sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-foreground/20">
                  <Sigma className="size-5" />
                </span>
                <p className="min-w-0 text-sm font-bold leading-snug">
                  {scope === "all"
                    ? `إجمالي قيمة الفواتير${statusSuffix}`
                    : `إجمالي فواتير ${SECTION_LABELS[scope]}${statusSuffix}`}
                </p>
              </div>
              {statusFilter === "all" && (
                <span className="tnum shrink-0 rounded-full bg-primary-foreground/20 px-2.5 py-0.5 text-xs font-extrabold">
                  تسليم {formatNumber(stats.deliveryPct)}٪
                </span>
              )}
            </div>
            <p className="tnum mt-3 break-words text-2xl font-extrabold sm:text-3xl">
              {formatNumber(stats.totalRevenue)}{" "}
              <span className="text-sm font-bold opacity-85 sm:text-base">ل.س</span>
            </p>
            <p className="mt-1 text-xs font-semibold opacity-90">
              {formatNumber(stats.totalRecords)} سجل في {scopeName}
              {statusSuffix}
            </p>
            {statusFilter === "all" && (
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/20"
                aria-label={`نسبة التسليم ${stats.deliveryPct}%`}
              >
                <div
                  className="h-full rounded-full bg-pearl transition-all duration-500"
                  style={{ width: `${stats.deliveryPct}%` }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <Kpi
              icon={<PackageOpen />}
              tone="pending"
              label="بضاعة غير مُسلّمة"
              hint={scope === "all" ? "قطع السجاد والحرامات + الطلبات" : undefined}
            >
              <Count value={stats.pendingGoods} unit={unit} />
            </Kpi>
            <Kpi icon={<PackageCheck />} tone="success" label="بضاعة تم تسليمها">
              <Count value={stats.deliveredGoods} unit={unit} />
            </Kpi>
            <Kpi icon={<HandCoins />} tone="success" label="المبالغ المحصّلة">
              <Money value={stats.deliveredRevenue} />
            </Kpi>
            <Kpi icon={<Clock />} tone="pending" label="المبالغ المستحقة">
              <Money value={stats.pendingRevenue} />
            </Kpi>
          </div>

          {scope === "all" && (
            <>
              <h3 className="mb-3 mt-6 font-display text-lg font-extrabold text-foreground">
                تفصيل حسب الأقسام
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {stats.sections.map((s) => (
                  <SectionCard key={s.key} s={s} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
