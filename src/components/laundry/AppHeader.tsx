import { useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { DatabaseBackup, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./BrandLogo";
import { BackupDialog } from "./BackupDialog";
import { ChangePinDialog } from "./ChangePinDialog";
import { setSearchQuery, useLaundry, useSearchQuery } from "@/lib/laundry/store";
import { filterInventory, filterServices } from "@/lib/laundry/records";
import { formatNumber } from "@/lib/laundry/format";

export function AppHeader() {
  const query = useSearchQuery();
  const state = useLaundry();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [activeDialog, setActiveDialog] = useState<"none" | "backup" | "changePin">("none");

  useEffect(() => {
    setActiveDialog("none");
  }, [pathname]);

  const matches = useMemo(() => {
    if (!query.trim()) return 0;
    return (
      filterInventory(state.inventory, "all", query).length +
      filterServices(state.services, "all", query).length
    );
  }, [query, state.inventory, state.services]);

  return (
    <header className="glass-strong relative mt-3 overflow-hidden rounded-3xl p-3 sm:p-4">
      {/* Subtle cleanliness sheen bar along top edge */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-primary via-wave-2 to-aqua-mint"
      />

      <div className="flex items-center gap-2.5 pt-0.5 sm:gap-3">
        <BrandLogo />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate font-display text-[1.45rem] font-extrabold leading-none tracking-tight text-foreground sm:text-[1.75rem]">
              مصبغة تولين
            </h1>
            <Sparkles
              aria-hidden="true"
              className="hidden size-4 shrink-0 text-primary sm:block"
              strokeWidth={2.3}
            />
          </div>
          <p className="mt-1.5 truncate text-xs font-bold text-muted-foreground sm:text-[13px]">
            عناية فائقة • غسيل وسجاد • كوي وخياطة
          </p>
        </div>
        <Button
          variant="glass"
          size="sm"
          onClick={() => setActiveDialog("backup")}
          title="النسخ الاحتياطي والأمان"
          className="h-auto min-h-11 shrink-0 flex-col gap-0.5 rounded-2xl px-2.5 py-1.5 text-[10px] font-extrabold leading-none"
        >
          <DatabaseBackup className="size-4.5 text-primary" />
          نسخ احتياطي
        </Button>
      </div>

      <div className="mt-3 flex h-12 items-center gap-1.5 rounded-2xl border border-input bg-pearl/90 px-3 shadow-xs transition focus-within:border-primary focus-within:ring-4 focus-within:ring-ring/20">
        <Search className="size-4.5 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم الزبون أو رقمه…"
          aria-label="بحث باسم الزبون أو رقمه"
          className="h-full min-w-0 flex-1 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/80 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <div className="flex shrink-0 items-center gap-1">
            <span className="tnum whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
              {formatNumber(matches)} نتيجة
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="مسح البحث"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>

      <BackupDialog
        open={activeDialog === "backup"}
        onOpenChange={(open) => setActiveDialog(open ? "backup" : "none")}
        onRequestChangePin={() => setActiveDialog("changePin")}
      />
      <ChangePinDialog
        open={activeDialog === "changePin"}
        onOpenChange={(open) => setActiveDialog(open ? "changePin" : "none")}
      />
    </header>
  );
}
