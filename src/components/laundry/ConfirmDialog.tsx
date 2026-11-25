import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassDialog } from "./GlassDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel,
  onConfirm,
  destructive,
}: Props) {
  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={message}
      icon={<AlertTriangle className={destructive ? "size-5 text-destructive" : "size-5"} />}
    >
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
          تراجع
        </Button>
        <Button variant={destructive ? "destructive" : "brand"} size="lg" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </GlassDialog>
  );
}
