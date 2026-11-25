import { useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ServiceRecord, ServiceSectionKey, StatusFilter } from "@/lib/laundry/types";
import { filterServices, statusCounts, summarizeRecords } from "@/lib/laundry/records";
import { SECTION_LABELS, SERVICE_DETAILS_LABELS } from "@/lib/laundry/sections";
import { laundry, useLaundry, useSearchQuery } from "@/lib/laundry/store";
import { SECTION_ICONS } from "./icons";
import { SectionHeader } from "./SectionHeader";
import { StatusFilterBar } from "./StatusFilterBar";
import { SectionSummaryStrip } from "./SectionSummaryStrip";
import { ServiceList } from "./ServiceList";
import { ServiceFormDialog } from "./ServiceFormDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState, ListSkeleton } from "./EmptyState";

interface Props {
  sectionKey: ServiceSectionKey;
  subtitle: string;
  /** Rendered under the header (e.g. the fourth view's sub-label editor). */
  extra?: ReactNode;
}

export function ServiceSection({ sectionKey, subtitle, extra }: Props) {
  const state = useLaundry();
  const query = useSearchQuery();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRecord | null>(null);
  const [deleting, setDeleting] = useState<ServiceRecord | null>(null);

  const sectionRecords = useMemo(
    () => state.services.filter((r) => r.sectionKey === sectionKey),
    [state.services, sectionKey],
  );
  const searchMatched = useMemo(
    () => filterServices(sectionRecords, "all", query),
    [sectionRecords, query],
  );
  const counts = useMemo(() => statusCounts(searchMatched), [searchMatched]);
  const visible = useMemo(() => filterServices(searchMatched, status, ""), [searchMatched, status]);
  const summary = useMemo(() => summarizeRecords(visible), [visible]);
  const Icon = SECTION_ICONS[sectionKey];

  const openAdd = () => {
    setDeleting(null);
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (r: ServiceRecord) => {
    setDeleting(null);
    setEditing(r);
    setFormOpen(true);
  };

  const openDelete = (r: ServiceRecord) => {
    setFormOpen(false);
    setEditing(null);
    setDeleting(r);
  };

  return (
    <section>
      <SectionHeader
        title={SECTION_LABELS[sectionKey]}
        subtitle={subtitle}
        icon={<Icon />}
        actions={
          <Button variant="brand" className="w-full sm:w-auto" onClick={openAdd}>
            <Plus strokeWidth={2.8} />
            إضافة طلب جديد
          </Button>
        }
      />
      {extra}

      <div className="mb-3">
        <StatusFilterBar value={status} onChange={setStatus} counts={counts} />
      </div>

      {state.ready && (
        <SectionSummaryStrip
          summary={summary}
          filtered={Boolean(query.trim() || status !== "all")}
        />
      )}

      {!state.ready ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          title={query ? "لا توجد نتائج مطابقة" : "لا توجد طلبات هنا"}
          hint={query ? "جرّب اسماً أو رقماً آخر" : "اضغط «إضافة طلب جديد» لإضافة أول طلب"}
        />
      ) : (
        <ServiceList
          records={visible}
          detailsLabel={SERVICE_DETAILS_LABELS[sectionKey]}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      )}

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        sectionKey={sectionKey}
        editing={editing}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="تأكيد حذف الطلب"
        message={`هل أنت متأكد من حذف طلب «${deleting?.customerName ?? ""}»؟ لا يمكن التراجع عن الحذف.`}
        confirmLabel="تأكيد الحذف"
        destructive
        onConfirm={() => {
          if (deleting) {
            laundry.deleteService(deleting.id);
            toast.success("تم حذف الطلب", { description: deleting.customerName });
          }
          setDeleting(null);
        }}
      />
    </section>
  );
}
