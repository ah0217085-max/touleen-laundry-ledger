import type { InventoryRecord, ServiceRecord, StatusFilter } from "./types";
import { clean, toLatinDigits } from "./format";
import { SECTION_LABELS } from "./sections";

/** Flip delivery status; stamps deliveredAt when delivered and clears it when undone. */
export function toggleDelivery<T extends InventoryRecord | ServiceRecord>(
  record: T,
  now: string,
): T {
  const isDelivered = !record.isDelivered;
  return { ...record, isDelivered, deliveredAt: isDelivered ? now : null, updatedAt: now };
}

function matchesStatus(r: { isDelivered: boolean }, status: StatusFilter): boolean {
  if (status === "pending") return !r.isDelivered;
  if (status === "delivered") return r.isDelivered;
  return true;
}

/** Normalizes Arabic letters (أ/إ/آ -> ا, ة -> ه, ى -> ي), digits (٠-٩ -> 0-9), and whitespace. */
export function normalizeArabicSearch(s: string | null | undefined): string {
  if (!s) return "";
  return toLatinDigits(String(s))
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Normalizes phone numbers by converting Arabic-Indic digits and ignoring spaces, dashes, and separators. */
export function normalizePhoneSearch(s: string | null | undefined): string {
  if (!s) return "";
  return toLatinDigits(String(s))
    .replace(/[\s\-().+]/g, "")
    .trim();
}

function matchesRecordQuery(
  rawQuery: string,
  name: string | null | undefined,
  phone: string | null | undefined,
): boolean {
  if (!clean(rawQuery)) return true;
  const nq = normalizeArabicSearch(rawQuery);
  const pq = normalizePhoneSearch(rawQuery);
  if (nq && normalizeArabicSearch(name).includes(nq)) return true;
  if (pq && normalizePhoneSearch(phone).includes(pq)) return true;
  return false;
}

export function filterInventory(records: InventoryRecord[], status: StatusFilter, query: string) {
  return records.filter(
    (r) => matchesStatus(r, status) && matchesRecordQuery(query, r.customerName, r.customerNumber),
  );
}

export function filterServices(records: ServiceRecord[], status: StatusFilter, query: string) {
  return records.filter(
    (r) => matchesStatus(r, status) && matchesRecordQuery(query, r.customerName, r.phoneNumber),
  );
}

export type GlobalSearchMatch =
  | { kind: "inventory"; record: InventoryRecord; sectionLabel: string }
  | { kind: "service"; record: ServiceRecord; sectionLabel: string };

/** Searches simultaneously across all inventory and service sections in real time. */
export function searchAllRecords(
  inventory: InventoryRecord[],
  services: ServiceRecord[],
  rawQuery: string,
): GlobalSearchMatch[] {
  if (!clean(rawQuery)) return [];
  const invMatches: GlobalSearchMatch[] = filterInventory(inventory, "all", rawQuery).map(
    (record) => ({
      kind: "inventory",
      record,
      sectionLabel: SECTION_LABELS[record.sectionKey],
    }),
  );
  const svcMatches: GlobalSearchMatch[] = filterServices(services, "all", rawQuery).map(
    (record) => ({
      kind: "service",
      record,
      sectionLabel: SECTION_LABELS[record.sectionKey],
    }),
  );
  return [...invMatches, ...svcMatches].sort((a, b) => {
    const ta = a.record.updatedAt || a.record.createdAt || a.record.receivedDate;
    const tb = b.record.updatedAt || b.record.createdAt || b.record.receivedDate;
    return tb.localeCompare(ta);
  });
}

export function statusCounts(records: { isDelivered: boolean }[]) {
  let delivered = 0;
  for (const r of records) if (r.isDelivered) delivered += 1;
  return { all: records.length, pending: records.length - delivered, delivered };
}

export interface SectionSummary {
  total: number;
  pending: number;
  delivered: number;
  pieces: number;
}

/** Summarizes total, pending, delivered, and optional piece count for visible records. */
export function summarizeRecords(
  records: readonly { isDelivered: boolean; itemCount?: number }[],
): SectionSummary {
  let delivered = 0;
  let pieces = 0;
  for (const r of records) {
    if (r.isDelivered) delivered += 1;
    if (typeof r.itemCount === "number" && Number.isFinite(r.itemCount) && r.itemCount > 0) {
      pieces += r.itemCount;
    }
  }
  return {
    total: records.length,
    pending: records.length - delivered,
    delivered,
    pieces,
  };
}
