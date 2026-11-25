import { useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { DatabaseBackup, LockKeyhole, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./BrandLogo";
import { BackupDialog } from "./BackupDialog";
import { ChangePinDialog } from "./ChangePinDialog";
import { searchAllRecords } from "@/lib/laundry/records";
import { setSearchQuery, useLaundry, useSearchQuery } from "@/lib/laundry/store";
import { formatNumber } from "@/lib/laundry/format";
import { lockApp, useSecurity } from "@/lib/security/session";

export function AppHeader() {
  const query = useSearchQuery();
  const state = useLaundry();
  const security = useSecurity();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [activeDialog, setActiveDialog] = useState<"none" | "backup" | "changePin">("none");

  useEffect(() => {
    setActiveDialog("none");
  }, [pathname]);

  const matchesCount = useMemo(
    () => (query.trim() ? searchAllRecords(state.inventory, state.services, query).length : 0),
    [query, state.inventory, state.services],
  );

  return (
    <header className="glass-strong relative mt-3 overflow-hidden rounded-3xl p-4 sm:p-5">
      {/* Subtle cleanliness sheen bar along top edge */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-primary via-wave-2 to-aqua-mint"
      />

      {/* 1. Minimal top utility row */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="glass"
          onClick={() => setActiveDialog("backup")}
          title="النسخ الاحتياطي وتغيير الرمز"
          className="min-h-11 rounded-2xl px-3.5 text-xs font-extrabold sm:text-[13px]"
        >
          <DatabaseBackup className="size-4 text-primary" />
          <span>النسخ الاحتياطي</span>
        </Button>

        <Button
          variant="glass"
          onClick={() => void lockApp()}
          disabled={security.busy}
          title="قفل التطبيق"
          aria-label="قفل التطبيق"
          className="min-h-11 rounded-2xl px-3.5 text-xs font-extrabold sm:text-[13px]"
        >
          <LockKeyhole className="size-4 text-muted-foreground" />
          <span>قفل</span>
        </Button>
      </div>

      {/* 2. Centered hero brand block */}
      <div className="mt-3 flex flex-col items-center gap-2.5 text-center sm:mt-4">
        <BrandLogo className="size-15 rounded-[1.2rem] sm:size-16" />
        <div className="max-w-md">
          <h1 className="text-balance font-display text-[1.65rem] font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
            مصبغة تولين
          </h1>
          <p className="mt-1 text-xs font-bold text-muted-foreground sm:text-sm">
            عناية فائقة • غسيل وسجاد • كوي وخياطة
          </p>
        </div>
      </div>

      {/* 3. Full-width search bar centered directly below brand */}
      <div className="mx-auto mt-4 flex min-h-12 w-full max-w-2xl items-center gap-2 rounded-2xl border border-input bg-pearl/95 px-3.5 shadow-xs transition focus-within:border-primary focus-within:ring-4 focus-within:ring-ring/20">
        <Search className="size-4.5 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم الزبون أو رقمه في جميع الأقسام…"
          aria-label="بحث باسم الزبون أو رقمه في جميع الأقسام"
          className="h-12 min-w-0 flex-1 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/80 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="tnum whitespace-nowrap text-xs font-extrabold text-primary">
              {formatNumber(matchesCount)} نتيجة
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              aria-label="مسح البحث"
              title="مسح البحث"
            >
              <X className="size-4.5" />
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
