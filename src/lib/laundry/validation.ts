import type { InventoryInput, InventorySectionKey, ServiceInput, ServiceSectionKey } from "./types";
import { clean } from "./format";

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
  invoiceAmount: string;
}

export const MESSAGES = {
  nameRequired: "اسم الزبون مطلوب",
  customerNumberRequired: "رقم الزبون مطلوب",
  phoneRequired: "رقم الهاتف مطلوب",
  detailsRequired: "التفاصيل مطلوبة",
  countPositive: "أدخل عدداً صحيحاً أكبر من صفر",
  dateRequired: "تاريخ الاستلام مطلوب",
  invoiceInvalid: "أدخل مبلغاً صحيحاً (صفر أو أكثر)",
} as const;

function parseNumber(raw: string): number | null {
  const s = clean(raw);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function validateInvoice(raw: string, errors: FieldErrors): number {
  const n = parseNumber(raw);
  if (n === null || n < 0) {
    errors["invoiceAmount"] = MESSAGES.invoiceInvalid;
    return 0;
  }
  return n;
}

export function validateInventory(
  sectionKey: InventorySectionKey,
  d: InventoryDraft,
): ValidationResult<InventoryInput> {
  const errors: FieldErrors = {};
  if (!clean(d.customerName)) errors["customerName"] = MESSAGES.nameRequired;
  if (!clean(d.customerNumber)) errors["customerNumber"] = MESSAGES.customerNumberRequired;
  const count = parseNumber(d.itemCount);
  if (count === null || count <= 0 || !Number.isInteger(count))
    errors["itemCount"] = MESSAGES.countPositive;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean(d.receivedDate)))
    errors["receivedDate"] = MESSAGES.dateRequired;
  const invoiceAmount = validateInvoice(d.invoiceAmount, errors);

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      sectionKey,
      customerName: clean(d.customerName),
      customerNumber: clean(d.customerNumber),
      itemCount: count ?? 0,
      receivedDate: clean(d.receivedDate),
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
  if (!clean(d.phoneNumber)) errors["phoneNumber"] = MESSAGES.phoneRequired;
  if (!clean(d.serviceDetails)) errors["serviceDetails"] = MESSAGES.detailsRequired;
  const invoiceAmount = validateInvoice(d.invoiceAmount, errors);

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      sectionKey,
      customerName: clean(d.customerName),
      phoneNumber: clean(d.phoneNumber),
      serviceDetails: clean(d.serviceDetails),
      invoiceAmount,
    },
  };
}
