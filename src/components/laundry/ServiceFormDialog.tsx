import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, NotebookPen, Phone, Receipt, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassDialog } from "./GlassDialog";
import { Field, inputClass } from "./Field";
import { SECTION_ICONS } from "./icons";
import type { ServiceRecord, ServiceSectionKey } from "@/lib/laundry/types";
import { validateService, type FieldErrors, type ServiceDraft } from "@/lib/laundry/validation";
import { SECTION_LABELS, SERVICE_DETAILS_LABELS } from "@/lib/laundry/sections";
import { todayISODate } from "@/lib/laundry/format";
import { laundry } from "@/lib/laundry/store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionKey: ServiceSectionKey;
  editing: ServiceRecord | null;
}

function toDraft(r: ServiceRecord | null): ServiceDraft {
  return {
    customerName: r?.customerName ?? "",
    phoneNumber: r?.phoneNumber ?? "",
    serviceDetails: r?.serviceDetails ?? "",
    receivedDate: r?.receivedDate ?? todayISODate(),
    invoiceAmount: r?.invoiceAmount != null ? String(r.invoiceAmount) : "",
  };
}

export function ServiceFormDialog({ open, onOpenChange, sectionKey, editing }: Props) {
  const [draft, setDraft] = useState<ServiceDraft>(() => toDraft(editing));
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (open) {
      setDraft(toDraft(editing));
      setErrors({});
    }
  }, [open, editing]);

  const set = (k: keyof ServiceDraft) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const Icon = SECTION_ICONS[sectionKey];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateService(sectionKey, draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (editing) {
      laundry.updateService(editing.id, result.value);
      toast.success("تم حفظ التعديلات", { description: result.value.customerName });
    } else {
      laundry.addService(result.value);
      toast.success("تمت إضافة الطلب", { description: result.value.customerName });
    }
    onOpenChange(false);
  };

  const errProps = (k: string) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `svc-${k}-error` : undefined,
  });

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        editing
          ? `تعديل طلب — ${SECTION_LABELS[sectionKey]}`
          : `إضافة طلب جديد — ${SECTION_LABELS[sectionKey]}`
      }
      icon={<Icon className="size-5" />}
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field
          id="svc-customerName"
          label="اسم الزبون"
          error={errors["customerName"]}
          icon={<User />}
        >
          <input
            id="svc-customerName"
            className={`${inputClass} h-12`}
            value={draft.customerName}
            onChange={(e) => set("customerName")(e.target.value)}
            placeholder="مثال: نور السامرائي"
            autoComplete="off"
            {...errProps("customerName")}
          />
        </Field>
        <Field
          id="svc-phoneNumber"
          label="رقم الهاتف"
          error={errors["phoneNumber"]}
          icon={<Phone />}
          required={false}
        >
          <input
            id="svc-phoneNumber"
            className={`${inputClass} h-12 text-right`}
            value={draft.phoneNumber}
            onChange={(e) => set("phoneNumber")(e.target.value)}
            placeholder="0936998877"
            inputMode="tel"
            dir="ltr"
            {...errProps("phoneNumber")}
          />
        </Field>
        <Field
          id="svc-serviceDetails"
          label={SERVICE_DETAILS_LABELS[sectionKey]}
          error={errors["serviceDetails"]}
          icon={<NotebookPen />}
          className="sm:col-span-2"
        >
          <textarea
            id="svc-serviceDetails"
            rows={3}
            className={`${inputClass} py-3 leading-relaxed`}
            value={draft.serviceDetails}
            onChange={(e) => set("serviceDetails")(e.target.value)}
            placeholder="مثال: تقصير بنطال جينز — 4 سم"
            {...errProps("serviceDetails")}
          />
        </Field>
        <Field
          id="svc-receivedDate"
          label="تاريخ الاستلام"
          error={errors["receivedDate"]}
          icon={<CalendarDays />}
          required={false}
          optionalLabel={editing ? "اختياري" : "تلقائي مع الوقت"}
        >
          <input
            id="svc-receivedDate"
            type="date"
            className={`${inputClass} h-12`}
            value={draft.receivedDate}
            onChange={(e) => set("receivedDate")(e.target.value)}
            {...errProps("receivedDate")}
          />
        </Field>
        <Field
          id="svc-invoiceAmount"
          label="الفاتورة المطلوبة (ل.س)"
          error={errors["invoiceAmount"]}
          icon={<Receipt />}
          required={false}
        >
          <input
            id="svc-invoiceAmount"
            type="number"
            min={0}
            step="any"
            className={`${inputClass} h-12`}
            value={draft.invoiceAmount}
            onChange={(e) => set("invoiceAmount")(e.target.value)}
            placeholder="مثال: 8000"
            inputMode="decimal"
            {...errProps("invoiceAmount")}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2 pt-1 sm:col-span-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button type="submit" variant="brand">
            {editing ? "حفظ التعديلات" : "إضافة"}
          </Button>
        </div>
      </form>
    </GlassDialog>
  );
}
