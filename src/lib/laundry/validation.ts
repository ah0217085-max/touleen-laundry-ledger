import type { InventoryInput, InventorySectionKey, ServiceInput, ServiceSectionKey } from "./types";
import { clean, isValidISODate, toLatinDigits, todayISODate } from "./format";

export type FieldErrors = Partial<Record<string, string>>;
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

export interface InventoryDraft {
  customerName: string;
  customerNumber: string;
  itemCount: string;
  receivedDate: string;
  invoiceAmount: string;
}

export interface ServiceDraft {
  customerName: string;
  phoneNumber: string;
  serviceDetails: string;
  receivedDate: string;
  invoiceAmount: string;
}

export const MESSAGES = {
  nameRequired: "اسم الزبون مطلوب",
  customerNumberRequired: "رقم الزبون مطلوب",
  phoneRequired: "رقم الهاتف مطلوب",
  detailsRequired: "التفاصيل مطلوبة",
  countPositive: "أدخل عدداً صحيحاً أكبر من صفر",
  dateRequired: "تاريخ الاستلام غير صالح",
  invoiceInvalid: "أدخل مبلغاً صحيحاً (صفر أو أكثر)",
} as const;

function parseNumber(raw: string): number | null {
  const s = toLatinDigits(clean(raw));
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function validateOptionalInvoice(raw: string, errors: FieldErrors): number | null {
  if (!clean(raw)) return null;
  const n = parseNumber(raw);
  if (n === null || n < 0) {
    errors["invoiceAmount"] = MESSAGES.invoiceInvalid;
    return null;
  }
  return n;
}

function resolveReceivedDate(raw: string, errors: FieldErrors): string {
  const s = clean(raw);
  if (!s) return todayISODate();
  if (!isValidISODate(s)) {
    errors["receivedDate"] = MESSAGES.dateRequired;
    return "";
  }
  return s;
}

export function validateInventory(
  sectionKey: InventorySectionKey,
  d: InventoryDraft,
): ValidationResult<InventoryInput> {
  const errors: FieldErrors = {};
  if (!clean(d.customerName)) errors["customerName"] = MESSAGES.nameRequired;
  const count = parseNumber(d.itemCount);
  if (count === null || count <= 0 || !Number.isInteger(count))
    errors["itemCount"] = MESSAGES.countPositive;
  const receivedDate = resolveReceivedDate(d.receivedDate, errors);
  const invoiceAmount = validateOptionalInvoice(d.invoiceAmount, errors);

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      sectionKey,
      customerName: clean(d.customerName),
      customerNumber: clean(d.customerNumber),
      itemCount: count ?? 0,
      receivedDate,
      invoiceAmount,
    },
  };
}

export function validateService(
  sectionKey: ServiceSectionKey,
  d: ServiceDraft,
): ValidationResult<ServiceInput> {
  const errors: FieldErrors = {};
  if (!clean(d.customerName)) errors["customerName"] = MESSAGES.nameRequired;
  if (!clean(d.serviceDetails)) errors["serviceDetails"] = MESSAGES.detailsRequired;
  const receivedDate = resolveReceivedDate(d.receivedDate, errors);
  const invoiceAmount = validateOptionalInvoice(d.invoiceAmount, errors);

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      sectionKey,
      customerName: clean(d.customerName),
      phoneNumber: clean(d.phoneNumber),
      serviceDetails: clean(d.serviceDetails),
      receivedDate,
      invoiceAmount,
    },
  };
}
