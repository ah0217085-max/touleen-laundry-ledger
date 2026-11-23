export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

export function formatNumber(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("ar-EG", { maximumFractionDigits: 2 });
}

export const CURRENCY = "ل.س";

export function clean(s: unknown): string {
  return s == null ? "" : String(s).trim();
}
