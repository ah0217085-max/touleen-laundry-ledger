import { useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clean, formatIntakeDateTime, formatNumber } from "@/lib/laundry/format";
import { searchAllRecords, type GlobalSearchMatch } from "@/lib/laundry/records";
import { ITEM_COUNT_LABELS, SERVICE_DETAILS_LABELS } from "@/lib/laundry/sections";
import { laundry, setSearchQuery, useLaundry, useSearchQuery } from "@/lib/laundry/store";
import type { InventoryRecord, ServiceRecord } from "@/lib/laundry/types";
import { SECTION_ICONS } from "./icons";
import { ContactActions } from "./ContactActions";
import { ConfirmDialog } from "./ConfirmDialog";
import { DeliveredStamp } from "./DeliveredStamp";
import { DeliveryToggle } from "./DeliveryToggle";
import { InventoryFormDialog } from "./InventoryFormDialog";
import { Money } from "./Money";
import { RowActions } from "./RowActions";
import { ServiceFormDialog } from "./ServiceFormDialog";

export function GlobalSearchResults() {
  const state = useLaundry();
  const query = useSearchQuery();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const trimmed = clean(query);

  const [editingInv, setEditingInv] = useState<InventoryRecord | null>(null);
  const [editingSvc, setEditingSvc] = useState<ServiceRecord | null>(null);
  const [deleting, setDeleting] = useState<GlobalSearchMatch | null>(null);

  useEffect(() => {
    setEditingInv(null);
    setEditingSvc(null);
    setDeleting(null);
  }, [pathname]);

  useEffect(() => {
    if (!trimmed) {
      setEditingInv(null);
      setEditingSvc(null);
      setDeleting(null);
    }
  }, [trimmed]);

  const matches = useMemo(
    () => (state.ready && trimmed ? searchAllRecords(state.inventory, state.services, query) : []),
    [state.ready, state.inventory, state.services, query, trimmed],
  );

  if (!state.ready || !trimmed) return null;

  const openEdit = (m: GlobalSearchMatch) => {
    setDeleting(null);
    if (m.kind === "inventory") {
      setEditingSvc(null);
      setEditingInv(m.record);
    } else {
      setEditingInv(null);
      setEditingSvc(m.record);
    }
  };

  const openDelete = (m: GlobalSearchMatch) => {
    setEditingInv(null);
    setEditingSvc(null);
    setDeleting(m);
  };

  const deleteMessage = deleting
    ? deleting.kind === "inventory"
      ? `هل أنت متأكد من حذف سجل «${deleting.record.customerName}» من قسم ${deleting.sectionLabel} (${formatNumber(deleting.record.itemCount)} قطعة)؟ لا يمكن التراجع عن الحذف.`
      : `هل أنت متأكد من حذف طلب «${deleting.record.customerName}» من قسم ${deleting.sectionLabel}؟ لا يمكن التراجع عن الحذف.`
    : "";

  return (
    <section
      aria-label="نتائج البحث في جميع الأقسام"
      className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="glass-strong rounded-3xl p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
          <div role="status" aria-live="polite" className="min-w-0">
            <h2 className="font-display text-base font-extrabold text-foreground sm:text-lg">
              نتائج البحث: <span className="tnum text-primary">{formatNumber(matches.length)}</span>
            </h2>
            <p className="text-xs font-semibold text-muted-foreground">بحث فوري عبر جميع الأقسام</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSearchQuery("")}
            className="min-h-11 rounded-2xl px-3.5 text-xs font-extrabold"
          >
            <X className="size-4" />
            مسح البحث
          </Button>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-glass-border bg-glass px-4 py-8 text-center">
            <span className="mx-auto mb-2.5 grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
              <Search className="size-5" />
            </span>
            <p className="text-base font-extrabold text-foreground">
              لا توجد نتائج مطابقة في أي قسم
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              لم نعثر على سجل يطابق «{query.trim()}» — جرّب اسماً أو رقم هاتف آخر
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {matches.map((match) => {
              const { kind, record, sectionLabel } = match;
              const SectionIcon = SECTION_ICONS[record.sectionKey];
              const phone = kind === "inventory" ? record.customerNumber : record.phoneNumber;

              return (
                <li key={`${kind}-${record.id}`} className="glass min-w-0 rounded-3xl p-4">
                  {/* Top row: Section category badge + one-tap Delivery toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-xl bg-accent px-2.5 py-1 text-xs font-extrabold text-accent-foreground">
                      <SectionIcon className="size-3.5 shrink-0" strokeWidth={2.4} />
                      <span>{sectionLabel}</span>
                    </span>
                    <DeliveryToggle
                      isDelivered={record.isDelivered}
                      customerName={record.customerName}
                      onToggle={() =>
                        kind === "inventory"
                          ? laundry.toggleInventory(record.id)
                          : laundry.toggleService(record.id)
                      }
                    />
                  </div>

                  {/* Customer name on its own clean row */}
                  <h3 className="mt-2.5 break-words text-base font-extrabold text-foreground sm:text-lg">
                    {record.customerName}
                  </h3>

                  {/* Phone + Call/WhatsApp or "بدون رقم" */}
                  <ContactActions
                    phone={phone}
                    customerName={record.customerName}
                    className="mt-2"
                  />

                  {/* Complete order details */}
                  <dl className="mt-3 grid grid-cols-2 gap-2.5 rounded-2xl bg-glass-strong p-3 text-sm">
                    {kind === "inventory" ? (
                      <div className="min-w-0">
                        <dt className="text-xs font-semibold text-muted-foreground">
                          {ITEM_COUNT_LABELS[record.sectionKey]}
                        </dt>
                        <dd className="tnum mt-0.5 font-extrabold text-foreground">
                          {formatNumber(record.itemCount)}
                        </dd>
                      </div>
                    ) : (
                      <div className="col-span-2 min-w-0">
                        <dt className="text-xs font-semibold text-muted-foreground">
                          {SERVICE_DETAILS_LABELS[record.sectionKey]}
                        </dt>
                        <dd className="mt-0.5 break-words text-sm font-bold leading-relaxed text-foreground">
                          {record.serviceDetails}
                        </dd>
                      </div>
                    )}

                    <div
                      className={
                        kind === "inventory"
                          ? "min-w-0"
                          : "col-span-2 min-w-0 border-t border-glass-border pt-2"
                      }
                    >
                      <dt className="text-xs font-semibold text-muted-foreground">الفاتورة</dt>
                      <dd className="mt-0.5">
                        <Money value={record.invoiceAmount} showUnset />
                      </dd>
                    </div>

                    <div className="col-span-2 min-w-0 border-t border-glass-border pt-2">
                      <dt className="text-xs font-semibold text-muted-foreground">
                        تاريخ الاستلام
                      </dt>
                      <dd className="mt-0.5 text-xs font-bold text-foreground">
                        {formatIntakeDateTime(record.receivedAt, record.receivedDate)}
                      </dd>
                    </div>

                    {record.isDelivered && (
                      <div className="col-span-2 min-w-0 border-t border-glass-border pt-2">
                        <dt className="text-xs font-semibold text-muted-foreground">
                          تاريخ التسليم
                        </dt>
                        <dd className="mt-0.5 text-xs">
                          <DeliveredStamp
                            isDelivered={record.isDelivered}
                            deliveredAt={record.deliveredAt}
                          />
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-2.5 flex justify-end">
                    <RowActions onEdit={() => openEdit(match)} onDelete={() => openDelete(match)} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editingInv && (
        <InventoryFormDialog
          open={true}
          onOpenChange={(o) => !o && setEditingInv(null)}
          sectionKey={editingInv.sectionKey}
          editing={editingInv}
        />
      )}

      {editingSvc && (
        <ServiceFormDialog
          open={true}
          onOpenChange={(o) => !o && setEditingSvc(null)}
          sectionKey={editingSvc.sectionKey}
          editing={editingSvc}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting?.kind === "inventory" ? "تأكيد حذف السجل" : "تأكيد حذف الطلب"}
        message={deleteMessage}
        confirmLabel="تأكيد الحذف"
        destructive
        onConfirm={() => {
          if (deleting) {
            if (deleting.kind === "inventory") {
              laundry.deleteInventory(deleting.record.id);
              toast.success("تم حذف السجل", { description: deleting.record.customerName });
            } else {
              laundry.deleteService(deleting.record.id);
              toast.success("تم حذف الطلب", { description: deleting.record.customerName });
            }
          }
          setDeleting(null);
        }}
      />
    </section>
  );
}
