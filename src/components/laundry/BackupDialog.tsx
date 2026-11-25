import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AlertCircle, CheckCircle2, DatabaseBackup, Download, Eraser, Upload, KeyRound, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { backupFileName } from "@/lib/laundry/backup";
import { exportSecureBackup, importSecureBackup, lockApp, pauseAutoLock, useSecurity } from "@/lib/security/session";
import { formatNumber, nowISO } from "@/lib/laundry/format";
import type { PersistedState } from "@/lib/laundry/types";
import { laundry, useLaundry } from "@/lib/laundry/store";
import { countSampleRecords } from "@/lib/laundry/seed";
import { GlassDialog } from "./GlassDialog";
import { ChangePinDialog } from "./ChangePinDialog";
import { PinField, useCooldown } from "./PinFields";

type Status = { tone: "ok" | "error"; text: string } | null;
type Pending = { state: PersistedState; inventoryCount: number; serviceCount: number; fileName: string } | null;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Download every record as JSON, or restore them from a validated JSON file. */
export function BackupDialog({ open, onOpenChange }: Props) {
  const state = useLaundry();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [confirmSamples, setConfirmSamples] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [fileText, setFileText] = useState<{ text: string; name: string } | null>(null);
  const [filePin, setFilePin] = useState("");
  const [busy, setBusy] = useState(false);
  const security = useSecurity();
  const seconds = useCooldown();
  const resumePicker = useRef<(() => void) | null>(null);
  const focusCleanup = useRef<(() => void) | null>(null);

  const endPicker = () => {
    resumePicker.current?.(); resumePicker.current = null;
    focusCleanup.current?.(); focusCleanup.current = null;
  };
  useEffect(() => {
    if (!open) endPicker();
    return () => endPicker();
  }, [open]);
  useEffect(() => {
    if (!fileText && !pending && !busy) return;
    return pauseAutoLock();
  }, [fileText, pending, busy]);

  useEffect(() => {
    if (open) {
      setStatus(null);
      setPending(null);
      setConfirmSamples(false);
      setFileText(null);
      setFilePin("");
    }
  }, [open]);

  const total = state.inventory.length + state.services.length;
  const samples = countSampleRecords(state);

  const removeSamples = () => {
    laundry.removeSamples();
    setConfirmSamples(false);
    setStatus({ tone: "ok", text: `تم حذف ${formatNumber(samples)} سجل تجريبي. سجلاتك الحقيقية لم تتغير.` });
    toast.success("تم حذف البيانات التجريبية");
  };

  const exportBackup = async () => {
    setBusy(true);
    try {
      const at = nowISO();
      const json = await exportSecureBackup(state, at);
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = backupFileName(at);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const text = `تم تنزيل نسخة احتياطية تحتوي على ${formatNumber(total)} سجل.`;
      setStatus({ tone: "ok", text });
      toast.success("تم تنزيل النسخة الاحتياطية");
    } catch {
      setStatus({ tone: "error", text: "تعذّر إنشاء ملف النسخة الاحتياطية، حاول مرة أخرى." });
    } finally { setBusy(false); }
  };

  const chooseFile = () => {
    endPicker();
    resumePicker.current = pauseAutoLock();
    const onFocus = () => {
      const timer = window.setTimeout(endPicker, 1500);
      focusCleanup.current = () => window.clearTimeout(timer);
    };
    window.addEventListener("focus", onFocus, { once: true });
    focusCleanup.current = () => window.removeEventListener("focus", onFocus);
    fileRef.current?.click();
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) { endPicker(); return; }
    setBusy(true);
    setPending(null);
    setFileText(null);
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ tone: "error", text: "الملف كبير جداً (أكثر من 10 ميغابايت)." });
      setBusy(false); endPicker();
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setStatus({ tone: "error", text: "تعذّرت قراءة الملف." });
      setBusy(false); endPicker();
      return;
    }
    setStatus(null);
    setFilePin("");
    setFileText({ text, name: file.name });
    setBusy(false); endPicker();
  };

  const decryptFile = async () => {
    if (!fileText) return;
    setBusy(true); setStatus(null);
    try {
      const result = await importSecureBackup(fileText.text, filePin);
      if (!result.ok) { setStatus({ tone: "error", text: result.error }); setFilePin(""); return; }
      setPending({ ...result, fileName: fileText.name });
      setFileText(null); setFilePin("");
    } catch (e) { setStatus({ tone: "error", text: e instanceof Error ? e.message : "تعذّر فك التشفير." }); setFilePin(""); }
    finally { setBusy(false); }
  };

  const confirmImport = () => {
    if (!pending) return;
    laundry.replaceAll(pending.state);
    const n = pending.inventoryCount + pending.serviceCount;
    setPending(null);
    setStatus({ tone: "ok", text: `تمت استعادة ${formatNumber(n)} سجل بنجاح.` });
    toast.success("تمت استعادة النسخة الاحتياطية", { description: `${formatNumber(n)} سجل` });
  };

  return (
    <GlassDialog
      open={open}
      onOpenChange={(v) => { if (!busy && !security.busy) onOpenChange(v); }}
      title="النسخ الاحتياطي"
      description="نسخك مشفّرة برمز PIN؛ احتفظ برمز كل نسخة لاستعادتها."
      icon={<DatabaseBackup className="size-5" />}
    >
      <div className="grid gap-3">
        <div className="rounded-2xl bg-glass-strong p-3 text-sm font-bold text-foreground">
          السجلات الحالية على هذا الجهاز: <span className="tnum">{formatNumber(total)}</span>
        </div>

        <Button variant="brand" size="lg" onClick={exportBackup} disabled={!state.ready || busy || security.busy}>
          <Download />
          تنزيل نسخة احتياطية مشفّرة (JSON)
        </Button>

        <Button variant="outline" size="lg" onClick={chooseFile} disabled={!state.ready || busy || security.busy}>
          <Upload />
          استعادة من ملف
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onFile}
          onCancel={endPicker}
          aria-label="اختيار ملف النسخة الاحتياطية"
        />

        {fileText && <div className="grid gap-3 rounded-2xl border border-glass-border bg-glass p-3">
          <p className="break-words text-sm font-bold text-foreground">{fileText.name}</p>
          <PinField label="رمز PIN الخاص بهذه النسخة" value={filePin} onChange={setFilePin} disabled={busy || seconds > 0} />
          {seconds > 0 && <p role="status" className="text-sm font-bold text-destructive">انتظر {seconds} ثانية.</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={busy} onClick={() => { setFileText(null); setFilePin(""); }}>إلغاء</Button>
            <Button variant="brand" disabled={busy || seconds > 0 || filePin.length !== 4} onClick={decryptFile}>{busy ? "جارٍ فك التشفير…" : "فك التشفير"}</Button>
          </div>
        </div>}

        {pending && (
          <div role="alert" className="rounded-2xl border border-pending/40 bg-pending-soft p-3 text-sm">
            <p className="font-extrabold text-pending-foreground">تأكيد الاستعادة</p>
            <p className="mt-1 break-words font-semibold leading-relaxed text-foreground">
              الملف «{pending.fileName}» يحتوي على {formatNumber(pending.inventoryCount)} سجل سجاد وحرامات و
              {formatNumber(pending.serviceCount)} طلب. سيتم استبدال جميع السجلات الحالية، ولا يمكن التراجع.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setPending(null)}>
                إلغاء
              </Button>
              <Button variant="brand" onClick={confirmImport}>
                استعادة الآن
              </Button>
            </div>
          </div>
        )}

        {state.ready && samples > 0 && (
          <div className="rounded-2xl border border-dashed border-glass-border bg-glass p-3 text-sm">
            <p className="font-semibold leading-relaxed text-foreground">
              يوجد {formatNumber(samples)} سجل تجريبي (زبائن أمثلة مثل «أحمد المصري»). يمكنك حذفها وإبقاء سجلاتك الحقيقية.
            </p>
            {confirmSamples ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setConfirmSamples(false)}>
                  إلغاء
                </Button>
                <Button variant="destructive" onClick={removeSamples}>
                  تأكيد الحذف
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="mt-2 w-full" onClick={() => setConfirmSamples(true)}>
                <Eraser />
                حذف البيانات التجريبية
              </Button>
            )}
          </div>
        )}

        {status && (
          <p
            role={status.tone === "error" ? "alert" : "status"}
            className={
              "flex items-start gap-1.5 rounded-2xl p-3 text-sm font-bold " +
              (status.tone === "error" ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success-foreground")
            }
          >
            {status.tone === "error" ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            )}
            {status.text}
          </p>
        )}
        {security.error && <p role="alert" className="text-sm font-bold text-destructive">{security.error}</p>}
        <div className="grid gap-2 border-t border-glass-border pt-3">
          <Button variant="outline" onClick={() => setChangeOpen(true)} disabled={busy || security.busy || Boolean(fileText || pending)}><KeyRound />تغيير رمز PIN</Button>
          <Button variant="glass" onClick={() => { onOpenChange(false); void lockApp(); }} disabled={busy || security.busy || Boolean(fileText || pending)}><LockKeyhole />قفل التطبيق</Button>
        </div>
      </div>
      <ChangePinDialog open={changeOpen} onOpenChange={setChangeOpen} />
    </GlassDialog>
  );
}
