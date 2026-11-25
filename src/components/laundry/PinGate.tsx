import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupPin, unlockPin, useSecurity, watchSecurity } from "@/lib/security/session";
import { BrandLogo } from "./BrandLogo";
import { PinField, useCooldown } from "./PinFields";

export function PinGate({ children }: { children: ReactNode }) {
  const security = useSecurity();
  const seconds = useCooldown();
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  useEffect(() => watchSecurity(), []);
  useEffect(() => {
    setPin("");
    setConfirmation("");
    setError("");
  }, [security.unlocked]);
  if (security.unlocked) return <>{children}</>;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (security.configured) await unlockPin(pin);
      else await setupPin(pin, confirmation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر فتح التطبيق؛ لم تتغير سجلاتك.");
      setPin("");
    }
  };
  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <BrandLogo size="lg" />
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-[2rem]">
              مصبغة تولين
            </h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <ShieldCheck className="size-3.5 text-aqua-ink" />
              دفتر إدارة الطلبات المحمي
            </p>
          </div>
        </div>
        <form
          onSubmit={submit}
          className="glass-strong relative grid gap-5 overflow-hidden rounded-3xl p-6"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-primary via-wave-2 to-aqua-mint"
          />
          <div className="flex items-center gap-3 text-foreground">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <LockKeyhole className="size-5" />
            </span>
            <h2 className="text-xl font-extrabold">
              {security.configured ? "التطبيق مقفل" : "إنشاء رمز PIN"}
            </h2>
          </div>
          {!security.ready ? (
            <p role="status" className="text-muted-foreground">
              جارٍ فتح الحماية…
            </p>
          ) : (
            <>
              <PinField
                label={security.configured ? "رمز PIN" : "رمز جديد من 4 أرقام"}
                value={pin}
                onChange={setPin}
                disabled={security.busy || seconds > 0}
              />
              {!security.configured && (
                <>
                  <PinField
                    label="تأكيد الرمز"
                    value={confirmation}
                    onChange={setConfirmation}
                    disabled={security.busy}
                  />
                  <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
                    احفظ الرمز جيداً؛ نسيانه يعني عدم القدرة على استعادة السجلات أو النسخ المشفّرة.
                  </p>
                </>
              )}
              {seconds > 0 && (
                <p role="status" className="font-bold text-destructive">
                  انتظر {seconds} ثانية قبل المحاولة التالية.
                </p>
              )}
              {(error || security.error) && (
                <p role="alert" className="text-sm font-bold text-destructive">
                  {error || security.error}
                </p>
              )}
              <Button
                type="submit"
                variant="brand"
                size="lg"
                disabled={
                  security.busy ||
                  seconds > 0 ||
                  pin.length !== 4 ||
                  (!security.configured && confirmation.length !== 4)
                }
              >
                <LockKeyhole />
                {security.busy
                  ? "جارٍ التحقق…"
                  : security.configured
                    ? "فتح التطبيق"
                    : "حفظ الرمز وتشفير السجلات"}
              </Button>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
