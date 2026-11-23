import { useMemo, useState } from "react";
import { DatabaseBackup, RotateCcw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./BrandLogo";
import { ConfirmDialog } from "./ConfirmDialog";
import { BackupDialog } from "./BackupDialog";
import { laundry, setSearchQuery, useLaundry, useSearchQuery } from "@/lib/laundry/store";
import { filterInventory, filterServices } from "@/lib/laundry/records";
import { formatNumber } from "@/lib/laundry/format";

export function AppHeader() {
  const query = useSearchQuery();
  const state = useLaundry();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  const matches = useMemo(() => {
    if (!query.trim()) return 0;
    return (
      filterInventory(state.inventory, "all", query).length +
      filterServices(state.services, "all", query).length
    );
  }, [query, state.inventory, state.services]);

  return (
    <header className="glass-strong mt-3 rounded-3xl p-3 sm:p-4">
      <div className="flex items-center gap-2.5">
        <BrandLogo />
        <div className="min-w-0 flex-1">
          <h1 className="whitespace-nowrap font-display text-[1.375rem] font-extrabold leading-none text-foreground sm:text-2xl">
            مصبغة تولين
          </h1>
          <p className="mt-1.5 truncate text-xs font-semibold text-muted-foreground">
            غسيل • تنظيف سجاد • تصليح وخياطة
          </p>
        </div>
        <Button
          variant="glass"
          size="icon-sm"
          onClick={() => setBackupOpen(true)}
          aria-label="النسخ الاحتياطي"
          title="النسخ الاحتياطي"
        >
          <DatabaseBackup />
        </Button>
        <Button
          variant="glass"
          size="icon-sm"
          onClick={() => setRestoreOpen(true)}
          aria-label="استعادة البيانات التجريبية"
          title="استعادة البيانات التجريبية"
        >
          <RotateCcw />
        </Button>
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم الزبون أو رقمه…"
          aria-label="بحث باسم الزبون أو رقمه"
          className="h-12 w-full rounded-2xl border border-input bg-glass-strong pr-10 pl-24 text-base font-medium text-foreground outline-none transition placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring/20 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <div className="absolute left-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <span className="tnum rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
              {formatNumber(matches)} نتيجة
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="مسح البحث"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>

      <BackupDialog open={backupOpen} onOpenChange={setBackupOpen} />
      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="استعادة البيانات التجريبية"
        message="سيتم استبدال جميع السجلات الحالية بالبيانات التجريبية. لا يمكن التراجع عن ذلك."
        confirmLabel="استعادة"
        onConfirm={() => {
          laundry.restoreSeed();
          setRestoreOpen(false);
          toast.success("تمت استعادة البيانات التجريبية");
        }}
      />
    </header>
  );
}
