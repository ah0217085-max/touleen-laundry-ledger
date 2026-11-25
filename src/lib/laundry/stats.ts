import type { InventoryRecord, SectionKey, ServiceRecord, StatusFilter } from "./types";
import { SECTION_LABELS } from "./sections";

export interface SectionStat {
  key: SectionKey;
  label: string;
  /** "piece" for carpets/blankets (sum of counts), "order" for service sections. */
  unit: "piece" | "order";
  records: number;
  pendingCount: number;
  deliveredCount: number;
  pendingRevenue: number;
  deliveredRevenue: number;
  totalRevenue: number;
}

export interface LaundryStats {
  pendingGoods: number;
  deliveredGoods: number;
  deliveredRevenue: number;
  pendingRevenue: number;
  totalRevenue: number;
  totalRecords: number;
  sections: SectionStat[];
}

const safeMoney = (v: number | null | undefined): number =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;

const safeCount = (v: number | null | undefined): number =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;

const sum = <T>(items: T[], pick: (t: T) => number) => items.reduce((a, t) => a + pick(t), 0);

function inventoryStat(all: InventoryRecord[], key: "carpets" | "blankets"): SectionStat {
  const recs = all.filter((r) => r.sectionKey === key);
  const pending = recs.filter((r) => !r.isDelivered);
  const delivered = recs.filter((r) => r.isDelivered);
  return {
    key,
    label: SECTION_LABELS[key],
    unit: "piece",
    records: recs.length,
    pendingCount: sum(pending, (r) => safeCount(r.itemCount)),
    deliveredCount: sum(delivered, (r) => safeCount(r.itemCount)),
    pendingRevenue: sum(pending, (r) => safeMoney(r.invoiceAmount)),
    deliveredRevenue: sum(delivered, (r) => safeMoney(r.invoiceAmount)),
    totalRevenue: sum(recs, (r) => safeMoney(r.invoiceAmount)),
  };
}

function serviceStat(all: ServiceRecord[], key: "tailoring" | "washing" | "fourth"): SectionStat {
  const recs = all.filter((r) => r.sectionKey === key);
  const pending = recs.filter((r) => !r.isDelivered);
  const delivered = recs.filter((r) => r.isDelivered);
  return {
    key,
    label: SECTION_LABELS[key],
    unit: "order",
    records: recs.length,
    pendingCount: pending.length,
    deliveredCount: delivered.length,
    pendingRevenue: sum(pending, (r) => safeMoney(r.invoiceAmount)),
    deliveredRevenue: sum(delivered, (r) => safeMoney(r.invoiceAmount)),
    totalRevenue: sum(recs, (r) => safeMoney(r.invoiceAmount)),
  };
}

/**
 * Live dashboard numbers. Goods = carpet/blanket pieces + service orders.
 * Money is the sum of invoiceAmount split by delivery status.
 */
export function computeStats(
  inventory: InventoryRecord[],
  services: ServiceRecord[],
): LaundryStats {
  const sections = [
    inventoryStat(inventory, "carpets"),
    inventoryStat(inventory, "blankets"),
    serviceStat(services, "tailoring"),
    serviceStat(services, "washing"),
    serviceStat(services, "fourth"),
  ];
  const pendingRevenue = sum(sections, (s) => s.pendingRevenue);
  const deliveredRevenue = sum(sections, (s) => s.deliveredRevenue);
  return {
    pendingGoods: sum(sections, (s) => s.pendingCount),
    deliveredGoods: sum(sections, (s) => s.deliveredCount),
    pendingRevenue,
    deliveredRevenue,
    totalRevenue: pendingRevenue + deliveredRevenue,
    totalRecords: inventory.length + services.length,
    sections,
  };
}

export type StatsScope = "all" | SectionKey;

export const STATS_SCOPES: StatsScope[] = [
  "all",
  "carpets",
  "blankets",
  "tailoring",
  "washing",
  "fourth",
];

export interface ScopedStats {
  pendingGoods: number;
  deliveredGoods: number;
  pendingRevenue: number;
  deliveredRevenue: number;
  totalRevenue: number;
  totalRecords: number;
  /** "mixed" = pieces + orders (all sections combined). */
  unit: "piece" | "order" | "mixed";
  sections: SectionStat[];
}

/** Narrows the dashboard numbers to all sections combined or a single section. */
export function scopeStats(stats: LaundryStats, scope: StatsScope): ScopedStats {
  if (scope === "all") {
    const {
      pendingGoods,
      deliveredGoods,
      pendingRevenue,
      deliveredRevenue,
      totalRevenue,
      totalRecords,
      sections,
    } = stats;
    return {
      pendingGoods,
      deliveredGoods,
      pendingRevenue,
      deliveredRevenue,
      totalRevenue,
      totalRecords,
      unit: "mixed",
      sections,
    };
  }
  const s = stats.sections.find((x) => x.key === scope);
  if (!s)
    return {
      pendingGoods: 0,
      deliveredGoods: 0,
      pendingRevenue: 0,
      deliveredRevenue: 0,
      totalRevenue: 0,
      totalRecords: 0,
      unit: "order",
      sections: [],
    };
  return {
    pendingGoods: s.pendingCount,
    deliveredGoods: s.deliveredCount,
    pendingRevenue: s.pendingRevenue,
    deliveredRevenue: s.deliveredRevenue,
    totalRevenue: s.totalRevenue,
    totalRecords: s.records,
    unit: s.unit,
    sections: [s],
  };
}

export interface FilteredScopedStats extends ScopedStats {
  deliveryPct: number;
}

function byStatus<T extends { isDelivered: boolean }>(records: T[], status: StatusFilter): T[] {
  if (status === "pending") return records.filter((r) => !r.isDelivered);
  if (status === "delivered") return records.filter((r) => r.isDelivered);
  return records;
}

/** Computes live statistics filtered by both section scope and delivery status. */
export function computeScopedStats(
  inventory: InventoryRecord[],
  services: ServiceRecord[],
  scope: StatsScope,
  status: StatusFilter = "all",
): FilteredScopedStats {
  const scoped = scopeStats(
    computeStats(byStatus(inventory, status), byStatus(services, status)),
    scope,
  );
  const totalGoods = scoped.pendingGoods + scoped.deliveredGoods;
  const deliveryPct = totalGoods === 0 ? 0 : Math.round((scoped.deliveredGoods / totalGoods) * 100);
  return { ...scoped, deliveryPct };
}
