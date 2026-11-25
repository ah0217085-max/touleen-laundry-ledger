import { useEffect, useState } from "react";
import { useSecurity } from "@/lib/security/session";

export function PinField({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return <label className="grid gap-2 text-sm font-bold text-foreground">
    {label}
    <input type="password" inputMode="numeric" pattern="[0-9]{4}" autoComplete="off" maxLength={4} value={value}
      onChange={(e) => onChange(e.target.value.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/\D/g, "").slice(0, 4))}
      disabled={disabled} aria-label={label} dir="ltr"
      className="h-14 w-full min-w-0 rounded-xl border border-input bg-glass-strong px-4 text-center text-2xl text-foreground outline-none focus-visible:ring-4 focus-visible:ring-ring/20" />
  </label>;
}

export function useCooldown() {
  const security = useSecurity();
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);
  return now ? Math.max(0, Math.ceil((security.cooldownUntil - now) / 1000)) : 0;
}