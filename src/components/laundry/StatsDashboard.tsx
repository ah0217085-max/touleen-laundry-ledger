import { useMemo, type ReactNode } from "react";
import { ChartColumn, Clock, HandCoins, PackageCheck, PackageOpen, Sigma } from "lucide-react";
import { computeStats, type SectionStat } from "@/lib/laundry/stats";
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

function Kpi({ icon, label, children, tone, hint }: { icon: ReactNode; label: string; children: ReactNode; tone: Tone; hint?: string }) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center gap-2.5">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl [&_svg]:size-5", TONE_ICON[tone])}>{icon}</span>
        <p className="text-sm font-bold leading-snug text-foreground">{label}</p>
      </div>
      <div className="mt-3 text-2xl">{children}</div>
      {hint && <p className="mt-1 text-xs font-semibold text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Count({ value, unit }: { value: number; unit: string }) {
  return (
    <span className="tnum font-extrabold text-foreground">
      {formatNumber(value)} <span className="text-sm font-semibold text-muted-foreground">{unit}</span>
    </span>
  );
}

function SectionCard({ s }: { s: SectionStat }) {
  const Icon = SECTION_ICONS[s.key];
  const unit = s.unit === "piece" ? "قطعة" : "طلب";
  const total = s.pendingCount + s.deliveredCount;
  const pct = total === 0 ? 0 : Math.round((s.deliveredCount / total) * 100);
  return (
    <article className="glass rounded-3xl p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid size-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
        <h4 className="flex-1 text-base font-extrabold text-foreground">{s.label}</h4>
        <span className="tnum text-xs font-bold text-muted-foreground">{formatNumber(s.records)} سجل</span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-pending-soft" aria-label={`نسبة التسليم ${pct}%`}>
        <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">غير مُسلّم</dt>
          <dd className="tnum font-extrabold text-pending-foreground">{formatNumber(s.pendingCount)} {unit}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">تم التسليم</dt>
          <dd className="tnum font-extrabold text-success-foreground">{formatNumber(s.deliveredCount)} {unit}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">مستحق</dt>
          <dd><Money value={s.pendingRevenue} /></dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">محصّل</dt>
          <dd><Money value={s.deliveredRevenue} /></dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-glass-strong px-3 py-2 text-sm">
        <span className="font-bold text-muted-foreground">إجمالي القيمة</span>
        <Money value={s.totalRevenue} />
      </div>
    </article>
  );
}

export function StatsDashboard() {
  const state = useLaundry();
  const stats = useMemo(() => computeStats(state.inventory, state.services), [state.inventory, state.services]);

  return (
    <section>
      <SectionHeader title="الإحصائيات" subtitle="أرقام لحظية محسوبة من السجلات الحالية" icon={<ChartColumn />} />

      {!state.ready ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass h-32 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="bg-total mb-3 rounded-3xl p-5 shadow-glow">
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary-foreground/20">
                <Sigma className="size-5" />
              </span>
              <p className="text-sm font-bold">إجمالي قيمة الفواتير الكلي</p>
            </div>
            <p className="tnum mt-3 text-3xl font-extrabold">
              {formatNumber(stats.totalRevenue)} <span className="text-base font-bold opacity-80">ل.س</span>
            </p>
            <p className="mt-1 text-xs font-semibold opacity-85">{formatNumber(stats.totalRecords)} سجل في جميع الأقسام</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Kpi icon={<PackageOpen />} tone="pending" label="إجمالي البضاعة الموجودة (غير المُسلّمة)" hint="قطع السجاد والحرامات + طلبات الأقسام الأخرى">
              <Count value={stats.pendingGoods} unit="قطعة / طلب" />
            </Kpi>
            <Kpi icon={<PackageCheck />} tone="success" label="إجمالي البضائع التي تم تسليمها">
              <Count value={stats.deliveredGoods} unit="قطعة / طلب" />
            </Kpi>
            <Kpi icon={<HandCoins />} tone="success" label="كمية المال مقابل البضائع التي تم تسليمها">
              <Money value={stats.deliveredRevenue} />
            </Kpi>
            <Kpi icon={<Clock />} tone="pending" label="المبالغ المستحقة / قيد التسليم">
              <Money value={stats.pendingRevenue} />
            </Kpi>
          </div>

          <h3 className="mb-3 mt-6 font-display text-lg font-extrabold text-foreground">تفصيل حسب الأقسام</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {stats.sections.map((s) => (
              <SectionCard key={s.key} s={s} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
