import type { InventoryRecord, PersistedState, ServiceRecord } from "./types";

/**
 * The demo customers earlier versions of the app added on first launch.
 * The app no longer adds them; this list only lets the owner remove them in one step.
 */
const SAMPLE_INVENTORY: ReadonlyArray<readonly [InventoryRecord["sectionKey"], string, string]> = [
  ["carpets", "أحمد المصري", "0935123456"],
  ["carpets", "فاطمة العلي", "0998765432"],
  ["carpets", "سمير الحلبي", "0944556677"],
  ["carpets", "رنا الشامي", "0932778899"],
  ["blankets", "ليلى حداد", "0988112233"],
  ["blankets", "خالد إبراهيم", "0955443322"],
  ["blankets", "سلمى يوسف", "0947665544"],
];

const SAMPLE_SERVICES: ReadonlyArray<readonly [ServiceRecord["sectionKey"], string, string, string]> = [
  ["tailoring", "نور السامرائي", "0936998877", "تقصير بنطال جينز — 4 سم"],
  ["tailoring", "مريم كنعان", "0991223344", "إصلاح سحاب فستان + خياطة حاشية"],
  ["tailoring", "يزن العمر", "0958112244", "تضييق قميص رسمي من الجانبين"],
  ["washing", "عمر الدباس", "0988776655", "غسيل وتنشيف بدلة رسمية + قميصين"],
  ["washing", "هبة الخطيب", "0944332211", "غسيل سترة شتوية ووشاح"],
  ["washing", "جود الحسن", "0937001122", "غسيل وكيّ 6 قطع ملابس أطفال"],
  ["fourth", "رامي منصور", "0933445566", "كيّ وترتيب ملابس موسمية"],
  ["fourth", "دانا الأحمد", "0996554433", "كيّ فستان سهرة وبدلة رسمية"],
];

/** Only records that still match a demo customer exactly (name, number and details). */
export function isSampleInventory(r: InventoryRecord): boolean {
  return SAMPLE_INVENTORY.some(([k, n, num]) => r.sectionKey === k && r.customerName === n && r.customerNumber === num);
}

export function isSampleService(r: ServiceRecord): boolean {
  return SAMPLE_SERVICES.some(
    ([k, n, phone, details]) =>
      r.sectionKey === k && r.customerName === n && r.phoneNumber === phone && r.serviceDetails === details,
  );
}

export function countSampleRecords(s: PersistedState): number {
  return s.inventory.filter(isSampleInventory).length + s.services.filter(isSampleService).length;
}

export function removeSampleRecords(s: PersistedState): PersistedState {
  return {
    ...s,
    inventory: s.inventory.filter((r) => !isSampleInventory(r)),
    services: s.services.filter((r) => !isSampleService(r)),
  };
}
