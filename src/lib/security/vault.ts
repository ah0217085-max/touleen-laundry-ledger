import { decryptText, derivePinSecrets, encryptText, isB64, isCipher, isKdfParams, isValidPin, newKdfParams, safeEqual, type Cipher, type KdfParams } from "./crypto";
import { buildBackup, parseBackup, readStored, serializeStored, type ImportResult } from "../laundry/backup";
import type { PersistedState } from "../laundry/types";

export const VAULT_KEY = "toleen-laundry-vault-v1";
export const LEGACY_KEY = "toleen-laundry-state-v1";
const APP = "toleen-laundry-encrypted";
export interface Vault {
  app: typeof APP;
  version: 1;
  kind: "store" | "backup";
  kdf: KdfParams;
  verifier: string;
  cipher: Cipher;
}
export interface VaultPayload { records: PersistedState; recovered: Record<string, string> }
export interface OpenVault { envelope: Vault; key: CryptoKey; payload: VaultPayload }
const header = (v: Omit<Vault, "cipher">) => JSON.stringify([v.app, v.version, v.kind, v.kdf.alg, v.kdf.salt, v.kdf.iterations, v.verifier]);

export function parseVault(raw: string): Vault {
  const v: unknown = JSON.parse(raw);
  if (typeof v !== "object" || v === null) throw new Error("الملف غير صالح أو غير مشفّر.");
  const o = v as Record<string, unknown>;
  if (o["app"] !== APP || o["version"] !== 1 || !["store", "backup"].includes(String(o["kind"])) || !isKdfParams(o["kdf"]) || !isB64(o["verifier"]) || !isCipher(o["cipher"]))
    throw new Error("الملف غير صالح أو من إصدار غير مدعوم.");
  return v as Vault;
}

export async function seal(envelope: Vault, key: CryptoKey, payload: VaultPayload): Promise<Vault> {
  return { ...envelope, cipher: await encryptText(key, JSON.stringify({ records: serializeStored(payload.records), recovered: payload.recovered }), header(envelope)) };
}

export async function createVault(pin: string, payload: VaultPayload): Promise<OpenVault> {
  if (!isValidPin(pin)) throw new Error("الرمز يجب أن يتكون من 4 أرقام.");
  const kdf = newKdfParams();
  const { key, verifier } = await derivePinSecrets(pin, kdf);
  const initial: Vault = { app: APP, version: 1, kind: "store", kdf, verifier, cipher: { iv: "", ct: "" } };
  return { key, payload, envelope: await seal(initial, key, payload) };
}

export async function openVault(raw: string, pin: string): Promise<OpenVault> {
  const envelope = parseVault(raw);
  const { key, verifier } = await derivePinSecrets(pin, envelope.kdf);
  if (!safeEqual(verifier, envelope.verifier)) throw new Error("رمز PIN غير صحيح.");
  const plain = await decryptText(key, envelope.cipher, header(envelope));
  if (plain === null) throw new Error("تعذّر فك التشفير؛ البيانات تالفة أو تم تعديلها.");
  const o = JSON.parse(plain) as Record<string, unknown>;
  if (typeof o["records"] !== "string") throw new Error("البيانات المشفّرة غير صالحة.");
  const read = readStored(o["records"]);
  if (read.preserveRaw) throw new Error("البيانات غير مدعومة؛ لم يتم تغيير سجلاتك.");
  const recovered: Record<string, string> = {};
  if (typeof o["recovered"] === "object" && o["recovered"] !== null) {
    for (const [k, v] of Object.entries(o["recovered"])) if (typeof v === "string") recovered[k] = v;
  }
  return { envelope, key, payload: { records: read.state, recovered } };
}

/** Original unreadable/old fragments are retained inside the ciphertext, never in clear text. */
export function legacyPayload(storage: Storage): VaultPayload {
  const raw = storage.getItem(LEGACY_KEY);
  const read = readStored(raw);
  const recovered: Record<string, string> = {};
  if (raw && read.preserveRaw) recovered[LEGACY_KEY] = raw;
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k?.startsWith(`${LEGACY_KEY}-recovered`)) {
      const v = storage.getItem(k);
      if (v !== null) recovered[k] = v;
    }
  }
  return { records: read.state, recovered };
}

export function removeLegacy(storage: Storage) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k === LEGACY_KEY || k?.startsWith(`${LEGACY_KEY}-recovered`)) keys.push(k);
  }
  keys.forEach((k) => storage.removeItem(k));
}

export async function encryptedBackup(open: OpenVault, state: PersistedState, _at: string): Promise<string> {
  const envelope = { ...open.envelope, kind: "backup" as const };
  return JSON.stringify(await seal(envelope, open.key, { records: state, recovered: open.payload.recovered }), null, 2);
}

export async function importEncryptedBackup(raw: string, pin: string): Promise<ImportResult> {
  try {
    const opened = await openVault(raw, pin);
    if (opened.envelope.kind !== "backup") throw new Error("اختر ملف نسخة احتياطية مشفّرة.");
    return parseBackup(buildBackup(opened.payload.records, "2026-01-01T00:00:00.000Z"));
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "تعذّر فك التشفير أو الملف غير صالح." };
  }
}