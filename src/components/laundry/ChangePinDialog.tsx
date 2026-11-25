import { useEffect, useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { changePin, useSecurity } from "@/lib/security/session";
import { toast } from "sonner";
import { GlassDialog } from "./GlassDialog";
import { PinField, useCooldown } from "./PinFields";

export function ChangePinDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [old, setOld] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const security = useSecurity();
  const seconds = useCooldown();
  useEffect(() => { if (open) { setOld(""); setPin(""); setConfirm(""); setError(""); } }, [open]);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError("");
    try { await changePin(old, pin, confirm); onOpenChange(false); toast.success("تم تغيير رمز PIN وتشفير السجلات بالرمز الجديد"); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذّر تغيير الرمز؛ لم تتغير سجلاتك."); setOld(""); }
  };
  return <GlassDialog open={open} onOpenChange={(v) => { if (!security.busy) onOpenChange(v); }} title="تغيير رمز PIN" description="النسخ السابقة تحتاج رمزها القديم عند الاستعادة." icon={<KeyRound className="size-5" />}>
    <form onSubmit={submit} className="grid gap-4">
      <PinField label="الرمز الحالي" value={old} onChange={setOld} disabled={security.busy || seconds > 0} />
      <PinField label="الرمز الجديد" value={pin} onChange={setPin} disabled={security.busy} />
      <PinField label="تأكيد الرمز الجديد" value={confirm} onChange={setConfirm} disabled={security.busy} />
      {seconds > 0 && <p role="status" className="font-bold text-destructive">انتظر {seconds} ثانية قبل المحاولة التالية.</p>}
      {error && <p role="alert" className="text-sm font-bold text-destructive">{error}</p>}
      <Button type="submit" variant="brand" size="lg" disabled={security.busy || seconds > 0 || old.length !== 4 || pin.length !== 4 || confirm.length !== 4}><KeyRound />{security.busy ? "جارٍ تغيير الرمز…" : "حفظ الرمز الجديد"}</Button>
    </form>
  </GlassDialog>;
}