import { describe, expect, it } from "vitest";
import { validateInventory, validateService, MESSAGES } from "./validation";
import { computeStats, computeScopedStats, scopeStats } from "./stats";
import { toggleDelivery, filterInventory, filterServices, summarizeRecords } from "./records";
import type { InventoryRecord, ServiceRecord } from "./types";
import { contactLinks } from "./contact";
import {
  buildBackup,
  parseBackup,
  normalizeState,
  BACKUP_ERRORS,
  readStored,
  serializeStored,
} from "./backup";
import { countSampleRecords, removeSampleRecords } from "./seed";
import { SECTION_LABELS, SERVICE_DETAILS_LABELS } from "./sections";
import { formatDate, formatDateTime, formatIntakeDateTime } from "./format";

const invDraft = {
  customerName: "أحمد",
  customerNumber: "0935123456",
  itemCount: "3",
  receivedDate: "2026-11-20",
  invoiceAmount: "45000",
};
const svcDraft = {
  customerName: "نور",
  phoneNumber: "0936",
  serviceDetails: "تقصير",
  receivedDate: "2026-11-20",
  invoiceAmount: "0",
};

function inv(p: Partial<InventoryRecord>): InventoryRecord {
  return {
    id: "i",
    sectionKey: "carpets",
    customerName: "x",
    customerNumber: "1",
    itemCount: 1,
    receivedDate: "2026-11-20",
    invoiceAmount: 0,
    isDelivered: false,
    deliveredAt: null,
    createdAt: "",
    updatedAt: "",
    ...p,
  };
}
function svc(p: Partial<ServiceRecord>): ServiceRecord {
  return {
    id: "s",
    sectionKey: "tailoring",
    customerName: "x",
    phoneNumber: "1",
    serviceDetails: "d",
    receivedDate: "2026-11-20",
    invoiceAmount: 0,
    isDelivered: false,
    deliveredAt: null,
    createdAt: "",
    updatedAt: "",
    ...p,
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
      sectionKey: "blankets",
      customerName: "ليلى",
      customerNumber: "0935123456",
      itemCount: 3,
      receivedDate: "2026-11-20",
      invoiceAmount: 45000,
    });
  });

  it("allows optional phone number and optional price on inventory and service records", () => {
    const invRes = validateInventory("carpets", {
      customerName: "سارة",
      customerNumber: "",
      itemCount: "2",
      receivedDate: "2026-11-20",
      invoiceAmount: "",
    });
    expect(invRes.ok).toBe(true);
    if (invRes.ok) {
      expect(invRes.value.customerNumber).toBe("");
      expect(invRes.value.invoiceAmount).toBeNull();
    }

    const svcRes = validateService("fourth", {
      customerName: "طلال",
      phoneNumber: "  ",
      serviceDetails: "كي بدلة",
      receivedDate: "2026-11-20",
      invoiceAmount: " ",
    });
    expect(svcRes.ok).toBe(true);
    if (svcRes.ok) {
      expect(svcRes.value.phoneNumber).toBe("");
      expect(svcRes.value.invoiceAmount).toBeNull();
    }
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

  it("treats null, undefined, and NaN invoice amounts as 0 without producing NaN", () => {
    const safe = computeStats(
      [
        inv({ sectionKey: "carpets", itemCount: 2, invoiceAmount: null }),
        inv({ sectionKey: "blankets", itemCount: 1, invoiceAmount: undefined }),
      ],
      [
        svc({ sectionKey: "fourth", invoiceAmount: Number.NaN }),
        svc({ sectionKey: "washing", invoiceAmount: 5000, isDelivered: true }),
      ],
    );
    expect(safe.pendingRevenue).toBe(0);
    expect(safe.deliveredRevenue).toBe(5000);
    expect(safe.totalRevenue).toBe(5000);
    expect(Number.isNaN(safe.totalRevenue)).toBe(false);
  });
});

describe("search", () => {
  it("matches customer name or phone number", () => {
    const recs = [
      svc({ id: "a", customerName: "مريم", phoneNumber: "0991" }),
      svc({ id: "b", customerName: "عمر", phoneNumber: "0988" }),
    ];
    expect(filterServices(recs, "all", "مريم").map((r) => r.id)).toEqual(["a"]);
    expect(filterServices(recs, "all", "0988").map((r) => r.id)).toEqual(["b"]);
  });

  it("normalizes Arabic variants (أ/إ/آ -> ا, ة -> ه, ى -> ي) and Arabic-Indic digits", () => {
    const invRecs = [
      inv({ id: "1", customerName: "أحمد   المصري", customerNumber: "٠٩٣٥ ١٢٣-٤٥٦" }),
      inv({ id: "2", customerName: "فاطمة العلي", customerNumber: "0998-765 432" }),
      inv({ id: "3", customerName: "سلمى يوسف", customerNumber: "" }),
    ];
    expect(filterInventory(invRecs, "all", "احمد المصري").map((r) => r.id)).toEqual(["1"]);
    expect(filterInventory(invRecs, "all", "فاطمه").map((r) => r.id)).toEqual(["2"]);
    expect(filterInventory(invRecs, "all", "سلمي").map((r) => r.id)).toEqual(["3"]);
    expect(filterInventory(invRecs, "all", "0935123").map((r) => r.id)).toEqual(["1"]);
    expect(filterInventory(invRecs, "all", "٠٩٩٨٧٦٥").map((r) => r.id)).toEqual(["2"]);
  });
});

describe("ironing view naming", () => {
  it("names the fourth view الكوي with تفاصيل الكوي", () => {
    expect(SECTION_LABELS.fourth).toBe("الكوي");
    expect(SERVICE_DETAILS_LABELS.fourth).toBe("تفاصيل الكوي");
  });
});

describe("call & WhatsApp links", () => {
  it("dials the sanitized number directly", () => {
    expect(contactLinks("093 512-3456").tel).toBe("tel:0935123456");
  });
  it("turns a local 09 number into an international wa.me link", () => {
    expect(contactLinks("0935123456").whatsapp).toBe("https://wa.me/963935123456");
  });
  it("keeps numbers already in international form and reads Arabic digits", () => {
    expect(contactLinks("+963 935 123 456").whatsapp).toBe("https://wa.me/963935123456");
    expect(contactLinks("٠٩٣٥١٢٣٤٥٦").whatsapp).toBe("https://wa.me/963935123456");
  });
  it("flags missing and invalid numbers", () => {
    expect(contactLinks("  ").problem).toBe("missing");
    expect(contactLinks("abc").problem).toBe("invalid");
    expect(contactLinks("0936").whatsapp).toBeNull();
    expect(contactLinks("0936").problem).toBe("whatsapp");
  });
});

describe("receipt date", () => {
  it("requires a real receipt date on service orders", () => {
    const r = validateService("fourth", { ...svcDraft, receivedDate: "2026-02-30" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors["receivedDate"]).toBe(MESSAGES.dateRequired);
  });
  it("gives older saved orders without a receipt date the day they were created", () => {
    const legacy = { ...svc({ createdAt: "2026-11-18T09:00:00" }) } as Partial<ServiceRecord>;
    delete legacy.receivedDate;
    const { state } = normalizeState({ inventory: [], services: [legacy] });
    expect(state.services[0]?.receivedDate).toBe("2026-11-18");
  });
  it("formats receivedAt with date & time and falls back safely for legacy date-only records", () => {
    const full = formatIntakeDateTime("2026-11-25T14:30:00.000Z", "2026-11-25");
    expect(full).toBe(formatDateTime("2026-11-25T14:30:00.000Z"));
    expect(full).not.toContain("Invalid");

    const legacyOnly = formatIntakeDateTime(undefined, "2026-11-20");
    expect(legacyOnly).toBe(formatDate("2026-11-20"));
    expect(legacyOnly).not.toContain("Invalid");

    expect(formatDate("not-a-date")).toBe("—");
  });
});

describe("JSON backup", () => {
  const state = {
    inventory: [
      inv({ id: "i1", createdAt: "2026-11-20T10:00:00.000Z", itemCount: 3, invoiceAmount: 45000 }),
    ],
    services: [
      svc({
        id: "s1",
        createdAt: "2026-11-21T10:00:00.000Z",
        isDelivered: true,
        deliveredAt: "2026-11-22T10:00:00.000Z",
      }),
      svc({ id: "s2", createdAt: "2026-11-23T10:00:00.000Z" }),
    ],
    fourthLabel: "",
  };

  it("exports the same file for the same records regardless of order", () => {
    const at = "2026-11-24T00:00:00.000Z";
    const reversed = { ...state, services: [...state.services].reverse() };
    expect(buildBackup(state, at)).toBe(buildBackup(reversed, at));
  });

  it("restores exactly what was exported", () => {
    const r = parseBackup(buildBackup(state, "2026-11-24T00:00:00.000Z"));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.inventoryCount).toBe(1);
      expect(r.serviceCount).toBe(2);
      expect(r.state.services.map((x) => x.id)).toEqual(["s2", "s1"]);
      expect(r.state.services[1]?.deliveredAt).toBe("2026-11-22T10:00:00.000Z");
    }
  });

  it("rejects the whole file when any record is invalid", () => {
    const bad = JSON.parse(buildBackup(state, "2026-11-24T00:00:00.000Z"));
    bad.inventory[0].itemCount = 0;
    const r = parseBackup(JSON.stringify(bad));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(BACKUP_ERRORS.invalidRecords(1));
  });

  it("rejects non-JSON and other apps' files", () => {
    expect(parseBackup("not json")).toEqual({ ok: false, error: BACKUP_ERRORS.notJson });
    expect(parseBackup(JSON.stringify({ app: "other", inventory: [], services: [] }))).toEqual({
      ok: false,
      error: BACKUP_ERRORS.wrongApp,
    });
  });
});

describe("statistics section filter", () => {
  const all = computeStats(
    [
      inv({ sectionKey: "carpets", itemCount: 3, invoiceAmount: 45000 }),
      inv({ sectionKey: "blankets", itemCount: 6, invoiceAmount: 36000, isDelivered: true }),
    ],
    [
      svc({ sectionKey: "fourth", invoiceAmount: 6000 }),
      svc({ sectionKey: "fourth", invoiceAmount: 18000, isDelivered: true }),
    ],
  );
  it("shows only the chosen section's figures", () => {
    const s = scopeStats(all, "fourth");
    expect(s.pendingGoods).toBe(1);
    expect(s.deliveredGoods).toBe(1);
    expect(s.deliveredRevenue).toBe(18000);
    expect(s.totalRevenue).toBe(24000);
    expect(s.sections.map((x) => x.key)).toEqual(["fourth"]);
  });
  it("combines every section for الكل", () => {
    expect(scopeStats(all, "all").totalRevenue).toBe(45000 + 36000 + 6000 + 18000);
  });

  it("filters scoped stats accurately by delivery status without NaN", () => {
    const invRecs = [
      inv({ sectionKey: "carpets", itemCount: 3, invoiceAmount: 45000, isDelivered: false }),
      inv({ sectionKey: "carpets", itemCount: 2, invoiceAmount: null, isDelivered: true }),
      inv({ sectionKey: "blankets", itemCount: 6, invoiceAmount: 36000, isDelivered: true }),
    ];
    const svcRecs = [
      svc({ sectionKey: "fourth", invoiceAmount: 6000, isDelivered: false }),
      svc({ sectionKey: "fourth", invoiceAmount: 18000, isDelivered: true }),
    ];

    const pendingAll = computeScopedStats(invRecs, svcRecs, "all", "pending");
    expect(pendingAll.pendingGoods).toBe(4);
    expect(pendingAll.deliveredGoods).toBe(0);
    expect(pendingAll.pendingRevenue).toBe(51000);
    expect(pendingAll.deliveredRevenue).toBe(0);
    expect(pendingAll.totalRevenue).toBe(51000);
    expect(pendingAll.totalRecords).toBe(2);

    const deliveredCarpets = computeScopedStats(invRecs, svcRecs, "carpets", "delivered");
    expect(deliveredCarpets.pendingGoods).toBe(0);
    expect(deliveredCarpets.deliveredGoods).toBe(2);
    expect(deliveredCarpets.totalRevenue).toBe(0);
    expect(deliveredCarpets.totalRecords).toBe(1);

    const allFourth = computeScopedStats(invRecs, svcRecs, "fourth", "all");
    expect(allFourth.deliveryPct).toBe(50);
    expect(allFourth.totalRevenue).toBe(24000);
  });

  it("summarizes visible section records with pending, delivered, and piece counts", () => {
    const summary = summarizeRecords([
      inv({ itemCount: 3, isDelivered: false }),
      inv({ itemCount: 4, isDelivered: true }),
      inv({ itemCount: 1, isDelivered: false }),
    ]);
    expect(summary).toEqual({ total: 3, pending: 2, delivered: 1, pieces: 8 });
  });
});

describe("saved data on the device", () => {
  it("starts empty on first launch instead of adding demo customers", () => {
    const r = readStored(null);
    expect(r.state.inventory).toHaveLength(0);
    expect(r.state.services).toHaveLength(0);
    expect(r.preserveRaw).toBe(false);
  });

  it("keeps a copy of unreadable saved data rather than silently replacing it", () => {
    expect(readStored("{broken").preserveRaw).toBe(true);
  });

  it("keeps a copy when the saved data comes from a newer app version", () => {
    expect(
      readStored(JSON.stringify({ version: 99, inventory: [], services: [] })).preserveRaw,
    ).toBe(true);
  });

  it("reads back exactly what it saved, including receipt and delivery times", () => {
    const state = {
      inventory: [
        inv({
          id: "a",
          createdAt: "2026-11-20T08:00:00.000Z",
          updatedAt: "2026-11-21T08:00:00.000Z",
          isDelivered: true,
          deliveredAt: "2026-11-21T08:00:00.000Z",
        }),
      ],
      services: [
        svc({
          id: "b",
          createdAt: "2026-11-22T08:00:00.000Z",
          updatedAt: "2026-11-22T08:00:00.000Z",
          receivedDate: "2026-11-19",
        }),
      ],
      fourthLabel: "",
    };
    const r = readStored(serializeStored(state));
    expect(r.preserveRaw).toBe(false);
    expect(r.state).toEqual(state);
  });

  it("reads data saved by the earlier version without a version number", () => {
    const old = {
      inventory: [inv({ id: "a", createdAt: "2026-11-20T08:00:00.000Z" })],
      services: [],
      fourthLabel: "",
    };
    const r = readStored(JSON.stringify(old));
    expect(r.state.inventory).toHaveLength(1);
    expect(r.preserveRaw).toBe(false);
  });

  it("preserves records with blank optional phone, null price, and receivedAt timestamp", () => {
    const state = {
      inventory: [
        inv({
          id: "opt1",
          customerNumber: "",
          invoiceAmount: null,
          receivedAt: "2026-11-25T08:04:00.000Z",
          createdAt: "2026-11-25T08:04:00.000Z",
          updatedAt: "2026-11-25T08:04:00.000Z",
        }),
      ],
      services: [
        svc({
          id: "opt2",
          phoneNumber: "",
          invoiceAmount: null,
          receivedAt: "2026-11-25T08:05:00.000Z",
          createdAt: "2026-11-25T08:05:00.000Z",
          updatedAt: "2026-11-25T08:05:00.000Z",
        }),
      ],
      fourthLabel: "",
    };
    const r = readStored(serializeStored(state));
    expect(r.preserveRaw).toBe(false);
    expect(r.state).toEqual(state);
    const parsed = parseBackup(buildBackup(state, "2026-11-25T08:10:00.000Z"));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state).toEqual(state);
    }
  });
});

describe("removing demo customers", () => {
  it("removes only untouched demo records and keeps real ones", () => {
    const state = {
      inventory: [
        inv({ id: "demo", customerName: "أحمد المصري", customerNumber: "0935123456" }),
        inv({ id: "real", customerName: "زبون حقيقي", customerNumber: "0935123456" }),
      ],
      services: [
        svc({
          id: "demo2",
          sectionKey: "fourth",
          customerName: "رامي منصور",
          phoneNumber: "0933445566",
          serviceDetails: "كيّ وترتيب ملابس موسمية",
        }),
        svc({
          id: "edited",
          sectionKey: "fourth",
          customerName: "رامي منصور",
          phoneNumber: "0933445566",
          serviceDetails: "كيّ بدلة",
        }),
      ],
      fourthLabel: "",
    };
    expect(countSampleRecords(state)).toBe(2);
    const next = removeSampleRecords(state);
    expect(next.inventory.map((r) => r.id)).toEqual(["real"]);
    expect(next.services.map((r) => r.id)).toEqual(["edited"]);
  });
});
