/**
 * Web Crypto helpers. Everything runs on the device; nothing here touches the network.
 * PIN -> PBKDF2-SHA256 (salted) -> master secret -> HKDF splits it into
 * a PIN verifier (compared on unlock) and a non-extractable AES-GCM-256 key.
 */
export const PIN_LENGTH = 4;
export const KDF_ITERATIONS = 600_000;
export const KDF_ALG = "PBKDF2-SHA256";

export interface KdfParams {
  alg: typeof KDF_ALG;
  salt: string;
  iterations: number;
}

export interface PinSecrets {
  verifier: string;
  key: CryptoKey;
}

export interface Cipher {
  iv: string;
  ct: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

export function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i] ?? 0);
  return btoa(s);
}

export function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export function isB64(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(v);
}

export function newKdfParams(iterations = KDF_ITERATIONS): KdfParams {
  return { alg: KDF_ALG, salt: toB64(crypto.getRandomValues(new Uint8Array(16))), iterations };
}

export async function derivePinSecrets(pin: string, kdf: KdfParams): Promise<PinSecrets> {
  const base = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const master = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromB64(kdf.salt), iterations: kdf.iterations },
    base,
    256,
  );
  const hkdf = await crypto.subtle.importKey("raw", master, "HKDF", false, ["deriveBits", "deriveKey"]);
  const empty = new Uint8Array(0);
  const verifierBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: empty, info: encoder.encode("toleen/pin-verifier/v1") },
    hkdf,
    256,
  );
  const key = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: empty, info: encoder.encode("toleen/aes-gcm/v1") },
    hkdf,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return { verifier: toB64(new Uint8Array(verifierBits)), key };
}

/** Compares without stopping at the first different character. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Fresh random 96-bit IV every call. `aad` binds the ciphertext to its surrounding header. */
export async function encryptText(key: CryptoKey, plain: string, aad: string): Promise<Cipher> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(aad) },
    key,
    encoder.encode(plain),
  );
  return { iv: toB64(iv), ct: toB64(new Uint8Array(ct)) };
}

/** Returns null when the key is wrong or anything (data, IV or header) was altered. */
export async function decryptText(key: CryptoKey, c: Cipher, aad: string): Promise<string | null> {
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(c.iv), additionalData: encoder.encode(aad) },
      key,
      fromB64(c.ct),
    );
    return decoder.decode(plain);
  } catch {
    return null;
  }
}

export function isCipher(v: unknown): v is Cipher {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return isB64(o["iv"]) && isB64(o["ct"]);
}

export function isKdfParams(v: unknown): v is KdfParams {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  const it = o["iterations"];
  return (
    o["alg"] === KDF_ALG &&
    isB64(o["salt"]) &&
    typeof it === "number" &&
    Number.isInteger(it) &&
    it >= 1000 &&
    it <= 10_000_000
  );
}
