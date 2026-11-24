/** Wrong-PIN throttling and inactivity auto-lock rules (pure; the session module applies them). */
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_COOLDOWN_MS = 30_000;
export const AUTO_LOCK_MS = 3 * 60_000;

export interface Attempts {
  failures: number;
  lockedUntil: number;
}

export const NO_ATTEMPTS: Attempts = { failures: 0, lockedUntil: 0 };

export function parseAttempts(raw: string | null): Attempts {
  if (!raw) return { ...NO_ATTEMPTS };
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const failures = typeof o["failures"] === "number" && o["failures"] >= 0 ? Math.floor(o["failures"]) : 0;
    const lockedUntil = typeof o["lockedUntil"] === "number" && o["lockedUntil"] > 0 ? o["lockedUntil"] : 0;
    return { failures, lockedUntil };
  } catch {
    return { ...NO_ATTEMPTS };
  }
}

/** Milliseconds left before another PIN may be tried; never more than one cooldown even if the clock moved back. */
export function cooldownLeft(a: Attempts, now: number): number {
  if (a.lockedUntil <= now) return 0;
  return Math.min(a.lockedUntil - now, PIN_COOLDOWN_MS);
}

/** The 5th wrong PIN in a row starts a 30-second cooldown and resets the count. */
export function recordFailure(a: Attempts, now: number): Attempts {
  const failures = a.failures + 1;
  if (failures >= MAX_PIN_ATTEMPTS) return { failures: 0, lockedUntil: now + PIN_COOLDOWN_MS };
  return { failures, lockedUntil: 0 };
}

export function attemptsLeft(a: Attempts): number {
  return Math.max(0, MAX_PIN_ATTEMPTS - a.failures);
}

export function shouldAutoLock(lastActivity: number, now: number, paused: boolean): boolean {
  return !paused && now - lastActivity >= AUTO_LOCK_MS;
}
