import { useSyncExternalStore } from "react";
import { derivePinSecrets, isValidPin, safeEqual } from "./crypto";
import { attemptsLeft, cooldownLeft, parseAttempts, recordFailure, shouldAutoLock, type Attempts } from "./throttle";
import { createVault, encryptedBackup, importEncryptedBackup, legacyPayload, openVault, removeLegacy, seal, VAULT_KEY, type OpenVault } from "./vault";
import type { PersistedState } from "../laundry/types";

interface Session { ready: boolean; configured: boolean; unlocked: boolean; busy: boolean; cooldownUntil: number; error: string }
const INITIAL: Session = { ready: false, configured: false, unlocked: false, busy: false, cooldownUntil: 0, error: "" };
const ATTEMPTS_KEY = "toleen-pin-attempts-v1";
let snapshot = INITIAL;
let vault: OpenVault | null = null;
let storedRaw: string | null = null;
let attempts: Attempts = { failures: 0, lockedUntil: 0 };
let queue: Promise<void> = Promise.resolve();
let saveFailed = false;
let paused = 0;
let lastActivity = 0;
const listeners = new Set<() => void>();
const dataListeners = new Set<() => void>();
function notify(update: Partial<Session>) { snapshot = { ...snapshot, ...update }; listeners.forEach((l) => l()); }
function changed() { dataListeners.forEach((l) => l()); }
export function onSecurityDataChange(l: () => void) { dataListeners.add(l); return () => { dataListeners.delete(l); }; }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function useSecurity() { return useSyncExternalStore(subscribe, () => snapshot, () => INITIAL); }
export function securityRecords(): PersistedState | null { return snapshot.unlocked ? vault?.payload.records ?? null : null; }

function write(envelope: OpenVault["envelope"]) {
  // A different tab may have changed the PIN or records: never overwrite its ciphertext.
  if (window.localStorage.getItem(VAULT_KEY) !== storedRaw) throw new Error("تغيّرت البيانات في نافذة أخرى. اقفل التطبيق وافتحه مجدداً.");
  const raw = JSON.stringify(envelope);
  window.localStorage.setItem(VAULT_KEY, raw);
  storedRaw = raw;
}
function setAttempts(a: Attempts) {
  attempts = a;
  window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(a));
  notify({ cooldownUntil: a.lockedUntil });
}
function checkAttempt(pin: string) {
  if (!isValidPin(pin)) throw new Error("أدخل رمزاً من 4 أرقام.");
  attempts = parseAttempts(window.localStorage.getItem(ATTEMPTS_KEY));
  if (cooldownLeft(attempts, Date.now()) > 0) throw new Error("المحاولات موقوفة مؤقتاً؛ انتظر انتهاء العدّ التنازلي.");
}
function wrongPin() {
  setAttempts(recordFailure(attempts, Date.now()));
  throw new Error(attempts.lockedUntil ? "توقفت المحاولات لمدة 30 ثانية." : `رمز PIN غير صحيح. بقيت ${attemptsLeft(attempts)} محاولات.`);
}

export function initializeSecurity() {
  try {
    storedRaw = window.localStorage.getItem(VAULT_KEY);
    attempts = parseAttempts(window.localStorage.getItem(ATTEMPTS_KEY));
    notify({ ready: true, configured: storedRaw !== null, cooldownUntil: attempts.lockedUntil });
  } catch { notify({ ready: true, error: "تعذّر الوصول إلى حفظ الجهاز. اسمح للمتصفح بحفظ البيانات ثم أعد فتح التطبيق." }); }
}

export async function setupPin(pin: string, confirmation: string) {
  if (snapshot.busy) return;
  if (!isValidPin(pin) || pin !== confirmation) throw new Error("أدخل رمزاً من 4 أرقام وتأكيداً مطابقاً.");
  notify({ busy: true, error: "" });
  try {
    if (window.localStorage.getItem(VAULT_KEY) !== null) throw new Error("تم إعداد رمز بالفعل؛ أعد فتح التطبيق.");
    const opened = await createVault(pin, legacyPayload(window.localStorage));
    write(opened.envelope); // Atomic: the verifier and ciphertext are always saved together.
    vault = opened;
    removeLegacy(window.localStorage); // Only after the encrypted copy has been saved successfully.
    lastActivity = Date.now();
    notify({ configured: true, unlocked: true });
    changed();
  } finally { notify({ busy: false }); }
}

export async function unlockPin(pin: string) {
  if (snapshot.busy) return;
  checkAttempt(pin);
  notify({ busy: true, error: "" });
  try {
    storedRaw = window.localStorage.getItem(VAULT_KEY);
    if (!storedRaw) throw new Error("لم يتم العثور على البيانات المشفّرة. أعد فتح التطبيق.");
    let opened: OpenVault;
    try { opened = await openVault(storedRaw, pin); }
    catch (e) { if (e instanceof Error && e.message === "رمز PIN غير صحيح.") wrongPin(); throw e; }
    if (opened.envelope.kind !== "store") throw new Error("حفظ الجهاز غير صالح.");
    if (window.localStorage.getItem(VAULT_KEY) !== storedRaw) throw new Error("تغيّرت البيانات أثناء الفتح؛ حاول مجدداً.");
    vault = opened;
    saveFailed = false;
    queue = Promise.resolve();
    setAttempts({ failures: 0, lockedUntil: 0 });
    // Clean up an interrupted migration, only with the valid vault now open.
    removeLegacy(window.localStorage);
    lastActivity = Date.now();
    notify({ unlocked: true });
    changed();
  } finally { notify({ busy: false }); }
}

/** Serialized writes prevent a slower earlier encryption from overwriting newer changes. */
export function saveSecurityRecords(records: PersistedState): Promise<boolean> {
  const opened = vault;
  if (!opened || !snapshot.unlocked) return Promise.resolve(false);
  opened.payload = { ...opened.payload, records };
  const payload = opened.payload;
  const job = queue.then(async () => {
    const envelope = await seal(opened.envelope, opened.key, payload);
    write(envelope);
    opened.envelope = envelope;
    saveFailed = false;
  });
  queue = job.catch(() => { saveFailed = true; });
  return job.then(() => true, () => false);
}

export async function lockApp() {
  if (!snapshot.unlocked || snapshot.busy) return;
  notify({ busy: true });
  await queue;
  if (saveFailed) { notify({ busy: false, error: "تعذّر حفظ آخر تغيير. نزّل نسخة احتياطية قبل إغلاق التطبيق." }); return; }
  vault = null;
  paused = 0;
  notify({ unlocked: false, busy: false, error: "" });
  changed();
}

export async function changePin(current: string, next: string, confirmation: string) {
  if (snapshot.busy || !vault) return;
  checkAttempt(current);
  if (!isValidPin(next) || next !== confirmation) throw new Error("الرمز الجديد يجب أن يكون 4 أرقام وتأكيده مطابقاً.");
  notify({ busy: true });
  try {
    const opened = vault;
    const { verifier } = await derivePinSecrets(current, opened.envelope.kdf);
    if (!safeEqual(verifier, opened.envelope.verifier)) wrongPin();
    await queue;
    if (saveFailed) throw new Error("تعذّر حفظ السجلات؛ لم يتم تغيير الرمز.");
    const replacement = await createVault(next, opened.payload);
    write(replacement.envelope);
    vault = replacement;
    setAttempts({ failures: 0, lockedUntil: 0 });
    lastActivity = Date.now();
  } finally { notify({ busy: false }); }
}

export async function exportSecureBackup(state: PersistedState, at: string) {
  if (!vault || !snapshot.unlocked) throw new Error("افتح التطبيق أولاً.");
  return encryptedBackup(vault, state, at);
}
export async function importSecureBackup(raw: string, pin: string) {
  checkAttempt(pin);
  const result = await importEncryptedBackup(raw, pin);
  if (!result.ok && result.error === "رمز PIN غير صحيح.") wrongPin();
  if (result.ok) setAttempts({ failures: 0, lockedUntil: 0 });
  return result;
}
export function pauseAutoLock() {
  paused++;
  let ended = false;
  return () => { if (!ended) { ended = true; paused = Math.max(0, paused - 1); lastActivity = Date.now(); } };
}
export function watchSecurity() {
  initializeSecurity();
  const activity = () => { lastActivity = Date.now(); };
  const events = ["pointerdown", "keydown", "input", "scroll"] as const;
  events.forEach((e) => window.addEventListener(e, activity, { passive: true }));
  const tick = () => { if (snapshot.unlocked && shouldAutoLock(lastActivity, Date.now(), paused > 0)) void lockApp(); };
  const interval = window.setInterval(tick, 1000);
  document.addEventListener("visibilitychange", tick);
  const storage = (e: StorageEvent) => {
    if (e.key === VAULT_KEY || e.key === null) {
      vault = null;
      notify({ unlocked: false, error: "تغيّرت البيانات في نافذة أخرى. أدخل الرمز لفتحها مجدداً." });
      changed();
    }
    if (e.key === ATTEMPTS_KEY) { attempts = parseAttempts(e.newValue); notify({ cooldownUntil: attempts.lockedUntil }); }
  };
  window.addEventListener("storage", storage);
  return () => {
    events.forEach((e) => window.removeEventListener(e, activity));
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", tick);
    window.removeEventListener("storage", storage);
  };
}