import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { InventoryRecord, InventorySectionKey, StatusFilter } from "@/lib/laundry/types";
import { filterInventory, statusCounts } from "@/lib/laundry/records";
import { ITEM_COUNT_LABELS, SECTION_LABELS } from "@/lib/laundry/sections";
import { formatNumber } from "@/lib/laundry/format";
import { laundry, useLaundry, useSearchQuery } from "@/lib/laundry/store";
import { NAV_ICONS, SECTION_ICONS } from "./icons";
import { SectionHeader } from "./SectionHeader";
import { StatusFilterBar } from "./StatusFilterBar";
import { InventoryList } from "./InventoryList";
import { InventoryFormDialog } from "./InventoryFormDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState, ListSkeleton } from "./EmptyState";

const TABS: InventorySectionKey[] = ["carpets", "blankets"];

export function InventorySection() {
  const state = useLaundry();
  const query = useSearchQuery();
  const [sub, setSub] = useState<InventorySectionKey>("carpets");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRecord | null>(null);
  const [deleting, setDeleting] = useState<InventoryRecord | null>(null);

  const sectionRecords = useMemo(() => state.inventory.filter((r) => r.sectionKey === sub), [state.inventory, sub]);
  const counts = useMemo(() => statusCounts(sectionRecords), [sectionRecords]);
  const visible = useMemo(() => filterInventory(sectionRecords, status, query), [sectionRecords, status, query]);
  const NavIcon = NAV_ICONS.inventory;

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <section>
      <SectionHeader
        title="السجاد والحرامات"
        subtitle="سجلات القطع المستلمة وحالة تسليمها"
        icon={<NavIcon />}
        actions={
          <Button variant="brand" className="w-full sm:w-auto" onClick={openAdd}>
            <Plus strokeWidth={2.8} />
            إضافة سجل جديد
          </Button>
        }
      />

      <div role="tablist" aria-label="القسم" className="glass mb-3 grid grid-cols-2 gap-1 rounded-2xl p-1">
        {TABS.map((key) => {
          const Icon = SECTION_ICONS[key];
          const active = sub === key;
          const n = state.inventory.filter((r) => r.sectionKey === key).length;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setSub(key);
                setStatus("all");
              }}
              className={
                "flex min-h-12 items-center justify-center gap-2 rounded-xl text-base font-extrabold transition-all " +
                (active ? "bg-brand shadow-glow" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")
              }
            >
              <Icon className="size-5" strokeWidth={2.3} />
              {SECTION_LABELS[key]}
              <span
                className={
                  "tnum rounded-full px-2 text-xs " +
                  (active ? "bg-primary-foreground/25" : "bg-accent text-accent-foreground")
                }
              >
                {state.ready ? formatNumber(n) : "…"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <StatusFilterBar value={status} onChange={setStatus} counts={counts} />
      </div>

      {!state.ready ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          title={query ? "لا توجد نتائج مطابقة" : "لا توجد سجلات هنا"}
          hint={query ? "جرّب اسماً أو رقماً آخر" : "اضغط «إضافة سجل جديد» لإضافة أول سجل"}
        />
      ) : (
        <InventoryList
          records={visible}
          countLabel={ITEM_COUNT_LABELS[sub]}
          onEdit={(r) => {
            setEditing(r);
            setFormOpen(true);
          }}
          onDelete={setDeleting}
        />
      )}

      <InventoryFormDialog open={formOpen} onOpenChange={setFormOpen} sectionKey={sub} editing={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="حذف السجل"
        message={`هل تريد حذف سجل «${deleting?.customerName ?? ""}»؟ لا يمكن التراجع عن الحذف.`}
        confirmLabel="حذف"
        destructive
        onConfirm={() => {
          if (deleting) {
            laundry.deleteInventory(deleting.id);
            toast("تم حذف السجل", { description: deleting.customerName });
          }
          setDeleting(null);
        }}
      />
    </section>
  );
}
