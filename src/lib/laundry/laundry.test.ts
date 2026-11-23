import { describe, expect, it } from "vitest";
import { validateInventory, validateService, MESSAGES } from "./validation";
import { computeStats } from "./stats";
import { toggleDelivery, filterServices } from "./records";
import type { InventoryRecord, ServiceRecord } from "./types";

const invDraft = {
  customerName: "أحمد",
  customerNumber: "0935123456",
  itemCount: "3",
  receivedDate: "2026-11-20",
  invoiceAmount: "45000",
};
const svcDraft = { customerName: "نور", phoneNumber: "0936", serviceDetails: "تقصير", invoiceAmount: "0" };

function inv(p: Partial<InventoryRecord>): InventoryRecord {
  return {
    id: "i", sectionKey: "carpets", customerName: "x", customerNumber: "1", itemCount: 1,
    receivedDate: "2026-11-20", invoiceAmount: 0, isDelivered: false, deliveredAt: null,
    createdAt: "", updatedAt: "", ...p,
  };
}
function svc(p: Partial<ServiceRecord>): ServiceRecord {
  return {
    id: "s", sectionKey: "tailoring", customerName: "x", phoneNumber: "1", serviceDetails: "d",
    invoiceAmount: 0, isDelivered: false, deliveredAt: null, createdAt: "", updatedAt: "", ...p,
  };
}

describe("validation", () => {
  it("rejects a whitespace-only customer name", () => {
    const r = validateService("washing", { ...svcDraft, customerName: "   " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors["customerName"]).toBe(MESSAGES.nameRequired);
  });

  it("requires carpet/blanket count greater than zero", () => {
    const r = validateInventory("carpets", { ...invDraft, itemCount: "0" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors["itemCount"]).toBe(MESSAGES.countPositive);
  });

  it("rejects a negative invoice but accepts zero", () => {
    expect(validateService("tailoring", { ...svcDraft, invoiceAmount: "-1" }).ok).toBe(false);
    expect(validateService("tailoring", { ...svcDraft, invoiceAmount: "0" }).ok).toBe(true);
  });

  it("trims and converts valid inventory input", () => {
    const r = validateInventory("blankets", { ...invDraft, customerName: "  ليلى  " });
    expect(r.ok && r.value).toEqual({
      sectionKey: "blankets", customerName: "ليلى", customerNumber: "0935123456",
      itemCount: 3, receivedDate: "2026-11-20", invoiceAmount: 45000,
    });
  });
});

describe("delivery toggle", () => {
  it("stamps deliveredAt when delivered and clears it when undone", () => {
    const on = toggleDelivery(svc({}), "2026-11-24T10:00:00.000Z");
    expect(on.isDelivered).toBe(true);
    expect(on.deliveredAt).toBe("2026-11-24T10:00:00.000Z");
    const off = toggleDelivery(on, "2026-11-24T11:00:00.000Z");
    expect(off.isDelivered).toBe(false);
    expect(off.deliveredAt).toBeNull();
  });
});

describe("statistics", () => {
  const inventory = [
    inv({ sectionKey: "carpets", itemCount: 3, invoiceAmount: 45000 }),
    inv({ sectionKey: "blankets", itemCount: 6, invoiceAmount: 36000, isDelivered: true }),
  ];
  const services = [
    svc({ sectionKey: "tailoring", invoiceAmount: 8000 }),
    svc({ sectionKey: "washing", invoiceAmount: 9000, isDelivered: true }),
  ];
  const s = computeStats(inventory, services);

  it("counts undelivered goods as pieces plus orders", () => {
    expect(s.pendingGoods).toBe(3 + 1);
    expect(s.deliveredGoods).toBe(6 + 1);
  });

  it("splits money by delivery status", () => {
    expect(s.deliveredRevenue).toBe(36000 + 9000);
    expect(s.pendingRevenue).toBe(45000 + 8000);
    expect(s.totalRevenue).toBe(98000);
  });
});

describe("search", () => {
  it("matches customer name or phone number", () => {
    const recs = [svc({ id: "a", customerName: "مريم", phoneNumber: "0991" }), svc({ id: "b", customerName: "عمر", phoneNumber: "0988" })];
    expect(filterServices(recs, "all", "مريم").map((r) => r.id)).toEqual(["a"]);
    expect(filterServices(recs, "all", "0988").map((r) => r.id)).toEqual(["b"]);
  });
});
