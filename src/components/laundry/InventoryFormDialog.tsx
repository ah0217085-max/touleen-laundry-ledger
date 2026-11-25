import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, Hash, Phone, Receipt, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassDialog } from "./GlassDialog";
import { Field, inputClass } from "./Field";
import { SECTION_ICONS } from "./icons";
import type { InventoryRecord, InventorySectionKey } from "@/lib/laundry/types";
import { validateInventory, type FieldErrors, type InventoryDraft } from "@/lib/laundry/validation";
import { ITEM_COUNT_LABELS, SECTION_LABELS } from "@/lib/laundry/sections";
import { todayISODate } from "@/lib/laundry/format";
import { laundry } from "@/lib/laundry/store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionKey: InventorySectionKey;
  editing: InventoryRecord | null;
}

function toDraft(r: InventoryRecord | null): InventoryDraft {
  return {
    customerName: r?.customerName ?? "",
    customerNumber: r?.customerNumber ?? "",
    itemCount: r ? String(r.itemCount) : "",
    receivedDate: r?.receivedDate ?? todayISODate(),
    invoiceAmount: r?.invoiceAmount != null ? String(r.invoiceAmount) : "",
  };
}

export function InventoryFormDialog({ open, onOpenChange, sectionKey, editing }: Props) {
  const [draft, setDraft] = useState<InventoryDraft>(() => toDraft(editing));
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (open) {
      setDraft(toDraft(editing));
      setErrors({});
    }
  }, [open, editing]);

  const set = (k: keyof InventoryDraft) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const countLabel = ITEM_COUNT_LABELS[sectionKey];
  const Icon = SECTION_ICONS[sectionKey];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateInventory(sectionKey, draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (editing) {
      laundry.updateInventory(editing.id, result.value);
      toast.success("تم حفظ التعديلات", { description: result.value.customerName });
    } else {
      laundry.addInventory(result.value);
      toast.success("تمت إضافة السجل", { description: result.value.customerName });
    }
    onOpenChange(false);
  };

  const errProps = (k: string) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `inv-${k}-error` : undefined,
  });

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        editing
          ? `تعديل سجل ${SECTION_LABELS[sectionKey]}`
          : `إضافة سجل جديد — ${SECTION_LABELS[sectionKey]}`
      }
      icon={<Icon className="size-5" />}
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field
          id="inv-customerName"
          label="اسم الزبون"
          error={errors["customerName"]}
          icon={<User />}
        >
          <input
            id="inv-customerName"
            className={`${inputClass} h-12`}
            value={draft.customerName}
            onChange={(e) => set("customerName")(e.target.value)}
            placeholder="مثال: أحمد المصري"
            autoComplete="off"
            {...errProps("customerName")}
          />
        </Field>
        <Field
          id="inv-customerNumber"
          label="رقم الزبون"
          error={errors["customerNumber"]}
          icon={<Phone />}
          required={false}
        >
          <input
            id="inv-customerNumber"
            className={`${inputClass} h-12 text-right`}
            value={draft.customerNumber}
            onChange={(e) => set("customerNumber")(e.target.value)}
            placeholder="0935123456"
            inputMode="tel"
            dir="ltr"
            {...errProps("customerNumber")}
          />
        </Field>
        <Field id="inv-itemCount" label={countLabel} error={errors["itemCount"]} icon={<Hash />}>
          <input
            id="inv-itemCount"
            type="number"
            min={1}
            step={1}
            className={`${inputClass} h-12`}
            value={draft.itemCount}
            onChange={(e) => set("itemCount")(e.target.value)}
            placeholder="مثال: 3"
            inputMode="numeric"
            {...errProps("itemCount")}
          />
        </Field>
        <Field
          id="inv-receivedDate"
          label="تاريخ الاستلام"
          error={errors["receivedDate"]}
          icon={<CalendarDays />}
          required={false}
          optionalLabel={editing ? "اختياري" : "تلقائي مع الوقت"}
        >
          <input
            id="inv-receivedDate"
            type="date"
            className={`${inputClass} h-12`}
            value={draft.receivedDate}
            onChange={(e) => set("receivedDate")(e.target.value)}
            {...errProps("receivedDate")}
          />
        </Field>
        <Field
          id="inv-invoiceAmount"
          label="الفاتورة المطلوبة (ل.س)"
          error={errors["invoiceAmount"]}
          icon={<Receipt />}
          required={false}
          className="sm:col-span-2"
        >
          <input
            id="inv-invoiceAmount"
            type="number"
            min={0}
            step="any"
            className={`${inputClass} h-12`}
            value={draft.invoiceAmount}
            onChange={(e) => set("invoiceAmount")(e.target.value)}
            placeholder="مثال: 45000"
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
