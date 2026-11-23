import { useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ServiceRecord, ServiceSectionKey, StatusFilter } from "@/lib/laundry/types";
import { filterServices, statusCounts } from "@/lib/laundry/records";
import { SECTION_LABELS, SERVICE_DETAILS_LABELS } from "@/lib/laundry/sections";
import { laundry, useLaundry, useSearchQuery } from "@/lib/laundry/store";
import { SECTION_ICONS } from "./icons";
import { SectionHeader } from "./SectionHeader";
import { StatusFilterBar } from "./StatusFilterBar";
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
  const counts = useMemo(() => statusCounts(sectionRecords), [sectionRecords]);
  const visible = useMemo(() => filterServices(sectionRecords, status, query), [sectionRecords, status, query]);
  const Icon = SECTION_ICONS[sectionKey];

  return (
    <section>
      <SectionHeader
        title={SECTION_LABELS[sectionKey]}
        subtitle={subtitle}
        icon={<Icon />}
        actions={
          <Button
            variant="brand"
            className="w-full sm:w-auto"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus strokeWidth={2.8} />
            إضافة طلب جديد
          </Button>
        }
      />
      {extra}

      <div className="mb-4">
        <StatusFilterBar value={status} onChange={setStatus} counts={counts} />
      </div>

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
          onEdit={(r) => {
            setEditing(r);
            setFormOpen(true);
          }}
          onDelete={setDeleting}
        />
      )}

      <ServiceFormDialog open={formOpen} onOpenChange={setFormOpen} sectionKey={sectionKey} editing={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="حذف الطلب"
        message={`هل تريد حذف طلب «${deleting?.customerName ?? ""}»؟ لا يمكن التراجع عن الحذف.`}
        confirmLabel="حذف"
        destructive
        onConfirm={() => {
          if (deleting) {
            laundry.deleteService(deleting.id);
            toast("تم حذف الطلب", { description: deleting.customerName });
          }
          setDeleting(null);
        }}
      />
    </section>
  );
}
