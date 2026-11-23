import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function GlassDialog({ open, onOpenChange, title, description, icon, children, className }: Props) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          dir="rtl"
          className={cn(
            "glass-strong fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-card/90 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-pop outline-none",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-10 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-10",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
            className,
          )}
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border sm:hidden" />
          <div className="mb-4 flex items-start gap-3">
            {icon && (
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
                {icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-lg font-extrabold text-foreground">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              aria-label="إغلاق"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
