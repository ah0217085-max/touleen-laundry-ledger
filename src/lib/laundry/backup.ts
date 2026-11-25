import type {
  InventoryRecord,
  InventorySectionKey,
  PersistedState,
  ServiceRecord,
  ServiceSectionKey,
} from "./types";
import { clean, isValidISODate, isValidTimestamp, toISODate } from "./format";

export const BACKUP_APP = "toleen-laundry";
export const BACKUP_VERSION = 1;

const INVENTORY_KEYS: readonly InventorySectionKey[] = ["carpets", "blankets"];
const SERVICE_KEYS: readonly ServiceSectionKey[] = ["tailoring", "washing", "fourth"];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function num(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function text(v: unknown): string | null {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

interface Base {
  id: string;
  customerName: string;
  invoiceAmount: number | null;
  receivedAt?: string | undefined;
  isDelivered: boolean;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function base(o: Obj): Base | null {
  const id = clean(o["id"]);
  const customerName = text(o["customerName"]);
  const rawAmount = o["invoiceAmount"];
  let invoiceAmount: number | null;
  if (
    rawAmount === undefined ||
    rawAmount === null ||
    (typeof rawAmount === "string" && rawAmount.trim() === "")
  ) {
    invoiceAmount = null;
  } else {
    const parsedAmount = num(rawAmount);
    if (parsedAmount === null || parsedAmount < 0) return null;
    invoiceAmount = parsedAmount;
  }
  if (!id || !customerName) return null;
  if (typeof o["isDelivered"] !== "boolean" || !isValidTimestamp(o["createdAt"])) return null;
  const isDelivered = o["isDelivered"];
  const createdAt = o["createdAt"];
  const deliveredAt = isDelivered && isValidTimestamp(o["deliveredAt"]) ? o["deliveredAt"] : null;
  const updatedAt = isValidTimestamp(o["updatedAt"]) ? o["updatedAt"] : createdAt;
  const receivedAt = isValidTimestamp(o["receivedAt"]) ? o["receivedAt"] : undefined;
  return {
    id,
    customerName,
    invoiceAmount,
    ...(receivedAt ? { receivedAt } : {}),
    isDelivered,
    deliveredAt,
    createdAt,
    updatedAt,
  };
}

/** Returns a clean carpet/blanket record, or null when the data is unusable. */
export function normalizeInventory(raw: unknown): InventoryRecord | null {
  if (!isObj(raw)) return null;
  const sectionKey = raw["sectionKey"] as InventorySectionKey;
  if (!INVENTORY_KEYS.includes(sectionKey)) return null;
  const b = base(raw);
  const customerNumber = raw["customerNumber"] == null ? "" : text(raw["customerNumber"]);
  const itemCount = num(raw["itemCount"]);
  const receivedDate = raw["receivedDate"];
  if (
    !b ||
    customerNumber === null ||
    itemCount === null ||
    itemCount <= 0 ||
    !Number.isInteger(itemCount)
  )
    return null;
  if (!isValidISODate(receivedDate)) return null;
  return { ...b, sectionKey, customerNumber, itemCount, receivedDate };
}

/** Returns a clean service order. Older orders without a receipt date get the day they were created. */
export function normalizeService(raw: unknown): ServiceRecord | null {
  if (!isObj(raw)) return null;
  const sectionKey = raw["sectionKey"] as ServiceSectionKey;
  if (!SERVICE_KEYS.includes(sectionKey)) return null;
  const b = base(raw);
  const phoneNumber = raw["phoneNumber"] == null ? "" : text(raw["phoneNumber"]);
  const serviceDetails = text(raw["serviceDetails"]);
  if (!b || phoneNumber === null || !serviceDetails) return null;
  const rd = raw["receivedDate"];
  const receivedDate = isValidISODate(rd) ? rd : toISODate(new Date(b.createdAt));
  return { ...b, sectionKey, phoneNumber, serviceDetails, receivedDate };
}

export interface NormalizedState {
  state: PersistedState;
  /** Records dropped because they were malformed or had a duplicate id. */
  invalid: number;
}

function collect<T extends { id: string }>(
  list: unknown,
  fn: (r: unknown) => T | null,
  seen: Set<string>,
) {
  const out: T[] = [];
  let invalid = 0;
  for (const raw of Array.isArray(list) ? list : []) {
    const rec = fn(raw);
    if (!rec || seen.has(rec.id)) invalid += 1;
    else {
      seen.add(rec.id);
      out.push(rec);
    }
  }
  return { out, invalid };
}

export function normalizeState(raw: unknown): NormalizedState {
  const o = isObj(raw) ? raw : {};
  const seen = new Set<string>();
  const inv = collect(o["inventory"], normalizeInventory, seen);
  const svc = collect(o["services"], normalizeService, seen);
  const fourthLabel =
    typeof o["fourthLabel"] === "string" ? o["fourthLabel"].trim().slice(0, 40) : "";
  return {
    state: { inventory: inv.out, services: svc.out, fourthLabel },
    invalid: inv.invalid + svc.invalid,
  };
}

export const EMPTY_STATE: PersistedState = { inventory: [], services: [], fourthLabel: "" };

export interface StoredRead {
  state: PersistedState;
  /** True when the saved text must be kept aside before it is overwritten (unreadable, newer, or partly broken). */
  preserveRaw: boolean;
}

/** Reads what the app saved on this device. Nothing saved yet means an empty app, never demo data. */
export function readStored(raw: string | null): StoredRead {
  if (raw === null || raw.trim() === "") return { state: { ...EMPTY_STATE }, preserveRaw: false };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { state: { ...EMPTY_STATE }, preserveRaw: true };
  }
  if (!isObj(data)) return { state: { ...EMPTY_STATE }, preserveRaw: true };
  const version = num(data["version"]);
  const { state, invalid } = normalizeState(data);
  return { state, preserveRaw: invalid > 0 || (version !== null && version > BACKUP_VERSION) };
}

/** What gets written to the device after every change: versioned, fixed key order. */
export function serializeStored(state: PersistedState): string {
  return JSON.stringify({
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    fourthLabel: state.fourthLabel,
    inventory: state.inventory,
    services: state.services,
  });
}

/** Newest first, ties broken by id, so the same data always produces the same file. */
function byNewest<T extends { createdAt: string; id: string }>(a: T, b: T): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

const invOut = (r: InventoryRecord) => ({
  id: r.id,
  sectionKey: r.sectionKey,
  customerName: r.customerName,
  customerNumber: r.customerNumber ?? "",
  itemCount: r.itemCount,
  receivedDate: r.receivedDate,
  ...(r.receivedAt ? { receivedAt: r.receivedAt } : {}),
  invoiceAmount: r.invoiceAmount ?? null,
  isDelivered: r.isDelivered,
  deliveredAt: r.deliveredAt,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const svcOut = (r: ServiceRecord) => ({
  id: r.id,
  sectionKey: r.sectionKey,
  customerName: r.customerName,
  phoneNumber: r.phoneNumber ?? "",
  serviceDetails: r.serviceDetails,
  receivedDate: r.receivedDate,
  ...(r.receivedAt ? { receivedAt: r.receivedAt } : {}),
  invoiceAmount: r.invoiceAmount ?? null,
  isDelivered: r.isDelivered,
  deliveredAt: r.deliveredAt,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

/** Deterministic JSON backup: fixed key order and record order. */
export function buildBackup(state: PersistedState, exportedAt: string): string {
  const inventory = [...state.inventory].sort(byNewest).map(invOut);
  const services = [...state.services].sort(byNewest).map(svcOut);
  return JSON.stringify(
    {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt,
      counts: { inventory: inventory.length, services: services.length },
      fourthLabel: state.fourthLabel,
      inventory,
      services,
    },
    null,
    2,
  );
}

export function backupFileName(exportedAt: string): string {
  const d = new Date(exportedAt);
  const day = Number.isNaN(d.getTime()) ? "backup" : toISODate(d);
  return `toleen-laundry-backup-${day}.json`;
}

export const BACKUP_ERRORS = {
  empty: "الملف فارغ.",
  notJson: "الملف ليس بصيغة JSON صالحة.",
  wrongApp: "هذا الملف ليس نسخة احتياطية لمصبغة تولين.",
  newerVersion: "هذه النسخة صادرة من إصدار أحدث من التطبيق ولا يمكن قراءتها.",
  noRecords: "الملف لا يحتوي على سجلات مصبغة تولين.",
  invalidRecords: (n: number) =>
    `يحتوي الملف على ${n} سجل غير صالح أو مكرر، لذلك لم يتم استيراد أي شيء.`,
} as const;

export type ImportResult =
  | { ok: true; state: PersistedState; inventoryCount: number; serviceCount: number }
  | { ok: false; error: string };

/** Strict import: the whole file is rejected if any record is malformed. */
export function parseBackup(textContent: string): ImportResult {
  if (!textContent.trim()) return { ok: false, error: BACKUP_ERRORS.empty };
  let data: unknown;
  try {
    data = JSON.parse(textContent);
  } catch {
    return { ok: false, error: BACKUP_ERRORS.notJson };
  }
  if (!isObj(data)) return { ok: false, error: BACKUP_ERRORS.noRecords };
  if ("app" in data && data["app"] !== BACKUP_APP)
    return { ok: false, error: BACKUP_ERRORS.wrongApp };
  const version = num(data["version"]);
  if (version !== null && version > BACKUP_VERSION)
    return { ok: false, error: BACKUP_ERRORS.newerVersion };
  if (!Array.isArray(data["inventory"]) || !Array.isArray(data["services"]))
    return { ok: false, error: BACKUP_ERRORS.noRecords };

  const { state, invalid } = normalizeState(data);
  if (invalid > 0) return { ok: false, error: BACKUP_ERRORS.invalidRecords(invalid) };
  state.inventory.sort(byNewest);
  state.services.sort(byNewest);
  return {
    ok: true,
    state,
    inventoryCount: state.inventory.length,
    serviceCount: state.services.length,
  };
}
