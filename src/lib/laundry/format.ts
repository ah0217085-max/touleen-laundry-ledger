export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date (YYYY-MM-DD) — never UTC, so "today" matches the shop's clock. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

export function nowISO(): string {
  return new Date().toISOString();
}

/** True for a real calendar date in YYYY-MM-DD form (rejects e.g. 2026-02-30). */
export function isValidISODate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** True for a string that parses to a real timestamp. */
export function isValidTimestamp(s: unknown): s is string {
  return typeof s === "string" && s.length > 0 && !Number.isNaN(new Date(s).getTime());
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

/** Date + time for timestamps such as deliveredAt. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatNumber(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("ar-EG", { maximumFractionDigits: 2 });
}

export const CURRENCY = "ل.س";

export function clean(s: unknown): string {
  return s == null ? "" : String(s).trim();
}
