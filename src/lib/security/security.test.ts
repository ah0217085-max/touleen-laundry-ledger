import { webcrypto } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { isValidPin } from "./crypto";
import { AUTO_LOCK_MS, cooldownLeft, recordFailure, shouldAutoLock } from "./throttle";
import { createVault, encryptedBackup, importEncryptedBackup, legacyPayload, LEGACY_KEY, openVault, removeLegacy, seal } from "./vault";
import { serializeStored } from "../laundry/backup";
import type { PersistedState } from "../laundry/types";

const records: PersistedState = {
  fourthLabel: "",
  inventory: [{ id: "real-1", sectionKey: "carpets", customerName: "زبون حقيقي للاختبار", customerNumber: "0933445566", itemCount: 7, invoiceAmount: 123456, receivedDate: "2026-11-25", isDelivered: false, deliveredAt: null, createdAt: "2026-11-25T06:00:00.000Z", updatedAt: "2026-11-25T06:00:00.000Z" }],
  services: [],
};
beforeAll(() => { vi.stubGlobal("crypto", webcrypto); });

describe("PIN rules", () => {
  it("requires exactly four digits", () => {
    expect(isValidPin("1234")).toBe(true);
    for (const pin of ["123", "12345", "12a4", ""]) expect(isValidPin(pin)).toBe(false);
  });
  it("locks attempts for 30 seconds after exactly five consecutive failures", () => {
    let a = { failures: 0, lockedUntil: 0 };
    for (let i = 0; i < 4; i++) a = recordFailure(a, 1000);
    expect(a.lockedUntil).toBe(0);
    expect(a.failures).toBe(4);
    a = recordFailure(a, 1000);
    expect(a).toEqual({ failures: 0, lockedUntil: 31_000 });
    expect(cooldownLeft(a, 1000)).toBe(30_000);
    expect(cooldownLeft(a, 31_000)).toBe(0);
  });
  it("auto-locks at three minutes, not before", () => {
    expect(AUTO_LOCK_MS).toBe(180_000);
    expect(shouldAutoLock(1000, 180_999, false)).toBe(false);
    expect(shouldAutoLock(1000, 181_000, false)).toBe(true);
  });
  it("pauses auto-lock throughout the active file flow", () => {
    expect(shouldAutoLock(1000, 999_999, true)).toBe(false);
  });
});

describe("local encrypted vault", () => {
  it("migrates real records and preserves recovered fragments only inside encrypted storage", async () => {
    window.localStorage.clear();
    window.localStorage.setItem(LEGACY_KEY, serializeStored(records));
    window.localStorage.setItem(`${LEGACY_KEY}-recovered`, "old-unreadable-record");
    const payload = legacyPayload(window.localStorage);
    const opened = await createVault("1234", payload);
    const raw = JSON.stringify(opened.envelope);
    for (const value of ["زبون حقيقي للاختبار", "0933445566", "123456", "old-unreadable-record"]) expect(raw).not.toContain(value);
    expect((await openVault(raw, "1234")).payload).toEqual(payload);
    removeLegacy(window.localStorage);
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(window.localStorage.getItem(`${LEGACY_KEY}-recovered`)).toBeNull();
  });
  it("rejects a wrong PIN and modified ciphertext without exposing records", async () => {
    const opened = await createVault("1234", { records, recovered: {} });
    await expect(openVault(JSON.stringify(opened.envelope), "9999")).rejects.toThrow();
    const ct = opened.envelope.cipher.ct;
    const modified = { ...opened.envelope, cipher: { ...opened.envelope.cipher, ct: (ct.startsWith("A") ? "B" : "A") + ct.slice(1) } };
    await expect(openVault(JSON.stringify(modified), "1234")).rejects.toThrow();
  });
  it("uses a fresh IV on each save and changes the key when the PIN changes", async () => {
    const first = await createVault("1234", { records, recovered: {} });
    const next = await seal(first.envelope, first.key, first.payload);
    expect(next.cipher.iv).not.toBe(first.envelope.cipher.iv);
    const changed = await createVault("5678", first.payload);
    expect(changed.envelope.kdf.salt).not.toBe(first.envelope.kdf.salt);
    await expect(openVault(JSON.stringify(changed.envelope), "1234")).rejects.toThrow();
    expect((await openVault(JSON.stringify(changed.envelope), "5678")).payload.records).toEqual(records);
  });
  it("exports encrypted backups and restores only with that backup's PIN", async () => {
    const opened = await createVault("1234", { records, recovered: {} });
    const raw = await encryptedBackup(opened, records, "2026-11-25T06:00:00.000Z");
    expect(raw).not.toContain("0933445566");
    expect((await importEncryptedBackup(raw, "9999")).ok).toBe(false);
    const result = await importEncryptedBackup(raw, "1234");
    expect(result.ok && result.state).toEqual(records);
    expect((await importEncryptedBackup(serializeStored(records), "1234")).ok).toBe(false);
  });
});