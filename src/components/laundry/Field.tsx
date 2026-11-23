import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-xl border border-input bg-glass-strong px-3.5 text-base font-medium text-foreground outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring/20 aria-[invalid=true]:border-destructive aria-[invalid=true]:bg-destructive-soft";

interface Props {
  id: string;
  label: string;
  error?: string | undefined;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Field({ id, label, error, icon, className, children }: Props) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-bold text-foreground">
        {icon && <span className="text-primary [&_svg]:size-4">{icon}</span>}
        {label}
        <span className="text-primary">*</span>
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-xs font-bold text-destructive">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
