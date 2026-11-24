import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AlertCircle, CheckCircle2, DatabaseBackup, Download, Eraser, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { backupFileName, buildBackup, parseBackup } from "@/lib/laundry/backup";
import { formatNumber, nowISO } from "@/lib/laundry/format";
import type { PersistedState } from "@/lib/laundry/types";
import { laundry, useLaundry } from "@/lib/laundry/store";
import { countSampleRecords } from "@/lib/laundry/seed";
import { GlassDialog } from "./GlassDialog";

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

  useEffect(() => {
    if (open) {
      setStatus(null);
      setPending(null);
      setConfirmSamples(false);
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

  const exportBackup = () => {
    try {
      const at = nowISO();
      const json = buildBackup(state, at);
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
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPending(null);
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ tone: "error", text: "الملف كبير جداً (أكثر من 10 ميغابايت)." });
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setStatus({ tone: "error", text: "تعذّرت قراءة الملف." });
      return;
    }
    const result = parseBackup(text);
    if (!result.ok) {
      setStatus({ tone: "error", text: result.error });
      toast.error("لم يتم الاستيراد", { description: result.error });
      return;
    }
    setStatus(null);
    setPending({ ...result, fileName: file.name });
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
      onOpenChange={onOpenChange}
      title="النسخ الاحتياطي"
      description="احفظ نسخة من جميع السجلات في ملف على جهازك، أو استعدها من ملف سابق."
      icon={<DatabaseBackup className="size-5" />}
    >
      <div className="grid gap-3">
        <div className="rounded-2xl bg-glass-strong p-3 text-sm font-bold text-foreground">
          السجلات الحالية على هذا الجهاز: <span className="tnum">{formatNumber(total)}</span>
        </div>

        <Button variant="brand" size="lg" onClick={exportBackup} disabled={!state.ready}>
          <Download />
          تنزيل نسخة احتياطية (JSON)
        </Button>

        <Button variant="outline" size="lg" onClick={() => fileRef.current?.click()} disabled={!state.ready}>
          <Upload />
          استعادة من ملف
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onFile}
          aria-label="اختيار ملف النسخة الاحتياطية"
        />

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
      </div>
    </GlassDialog>
  );
}
