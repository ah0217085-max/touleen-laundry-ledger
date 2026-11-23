import type { InventoryRecord, PersistedState, ServiceRecord } from "./types";
import { toISODate, uid } from "./format";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

type InvSeed = [InventoryRecord["sectionKey"], string, string, number, number, number, number | null];
type SvcSeed = [ServiceRecord["sectionKey"], string, string, string, number, number, number | null];

// [section, name, number, count, invoice, receivedDaysAgo, deliveredDaysAgo|null]
const INVENTORY: InvSeed[] = [
  ["carpets", "أحمد المصري", "0935123456", 3, 45000, 2, null],
  ["carpets", "فاطمة العلي", "0998765432", 2, 30000, 5, 1],
  ["carpets", "سمير الحلبي", "0944556677", 5, 75000, 1, null],
  ["carpets", "رنا الشامي", "0932778899", 1, 15000, 7, 3],
  ["blankets", "ليلى حداد", "0988112233", 4, 20000, 3, null],
  ["blankets", "خالد إبراهيم", "0955443322", 6, 36000, 6, 2],
  ["blankets", "سلمى يوسف", "0947665544", 2, 12000, 1, null],
];

// [section, name, phone, details, invoice, createdDaysAgo, deliveredDaysAgo|null]
const SERVICES: SvcSeed[] = [
  ["tailoring", "نور السامرائي", "0936998877", "تقصير بنطال جينز — 4 سم", 8000, 1, null],
  ["tailoring", "مريم كنعان", "0991223344", "إصلاح سحاب فستان + خياطة حاشية", 15000, 4, 1],
  ["tailoring", "يزن العمر", "0958112244", "تضييق قميص رسمي من الجانبين", 10000, 2, null],
  ["washing", "عمر الدباس", "0988776655", "غسيل وتنشيف بدلة رسمية + قميصين", 12000, 2, null],
  ["washing", "هبة الخطيب", "0944332211", "غسيل سترة شتوية ووشاح", 9000, 5, 1],
  ["washing", "جود الحسن", "0937001122", "غسيل وكيّ 6 قطع ملابس أطفال", 11000, 1, null],
  ["fourth", "رامي منصور", "0933445566", "كيّ وترتيب ملابس موسمية", 6000, 1, null],
  ["fourth", "دانا الأحمد", "0996554433", "غسيل فستان سهرة + تصليح الحزام", 18000, 3, 1],
];

export function buildSeedState(): PersistedState {
  const inventory: InventoryRecord[] = INVENTORY.map(([sectionKey, customerName, customerNumber, itemCount, invoiceAmount, received, delivered]) => {
    const deliveredAt = delivered === null ? null : daysAgo(delivered).toISOString();
    return {
      id: uid(),
      sectionKey,
      customerName,
      customerNumber,
      itemCount,
      receivedDate: toISODate(daysAgo(received)),
      invoiceAmount,
      isDelivered: delivered !== null,
      deliveredAt,
      createdAt: daysAgo(received).toISOString(),
      updatedAt: deliveredAt ?? daysAgo(received).toISOString(),
    };
  });
  const services: ServiceRecord[] = SERVICES.map(([sectionKey, customerName, phoneNumber, serviceDetails, invoiceAmount, created, delivered]) => {
    const deliveredAt = delivered === null ? null : daysAgo(delivered).toISOString();
    return {
      id: uid(),
      sectionKey,
      customerName,
      phoneNumber,
      serviceDetails,
      invoiceAmount,
      isDelivered: delivered !== null,
      deliveredAt,
      createdAt: daysAgo(created).toISOString(),
      updatedAt: deliveredAt ?? daysAgo(created).toISOString(),
    };
  });
  return { inventory, services, fourthLabel: "" };
}
