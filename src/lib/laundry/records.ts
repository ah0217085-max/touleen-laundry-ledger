import type { InventoryRecord, ServiceRecord, StatusFilter } from "./types";
import { clean } from "./format";

/** Flip delivery status; stamps deliveredAt when delivered and clears it when undone. */
export function toggleDelivery<T extends InventoryRecord | ServiceRecord>(record: T, now: string): T {
  const isDelivered = !record.isDelivered;
  return { ...record, isDelivered, deliveredAt: isDelivered ? now : null, updatedAt: now };
}

function matchesStatus(r: { isDelivered: boolean }, status: StatusFilter): boolean {
  if (status === "pending") return !r.isDelivered;
  if (status === "delivered") return r.isDelivered;
  return true;
}

function matchesQuery(q: string, ...fields: string[]): boolean {
  if (!q) return true;
  return fields.some((f) => f.toLowerCase().includes(q));
}

export function filterInventory(records: InventoryRecord[], status: StatusFilter, query: string) {
  const q = clean(query).toLowerCase();
  return records.filter(
    (r) => matchesStatus(r, status) && matchesQuery(q, r.customerName, r.customerNumber),
  );
}

export function filterServices(records: ServiceRecord[], status: StatusFilter, query: string) {
  const q = clean(query).toLowerCase();
  return records.filter(
    (r) => matchesStatus(r, status) && matchesQuery(q, r.customerName, r.phoneNumber),
  );
}

export function statusCounts(records: { isDelivered: boolean }[]) {
  let delivered = 0;
  for (const r of records) if (r.isDelivered) delivered += 1;
  return { all: records.length, pending: records.length - delivered, delivered };
}
