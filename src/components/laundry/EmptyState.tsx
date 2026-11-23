import { PackageOpen } from "lucide-react";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="glass flex flex-col items-center rounded-3xl border-dashed px-6 py-12 text-center">
      <span className="mb-3 grid size-16 place-items-center rounded-full bg-accent text-accent-foreground">
        <PackageOpen className="size-8" />
      </span>
      <p className="text-base font-bold text-foreground">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="جارٍ التحميل">
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass h-36 animate-pulse rounded-3xl" />
      ))}
    </div>
  );
}
