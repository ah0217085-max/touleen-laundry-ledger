import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={onEdit}
        aria-label="تعديل"
        title="تعديل"
        className="size-11 rounded-xl"
      >
        <Pencil className="size-4.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label="حذف"
        title="حذف"
        className="size-11 rounded-xl hover:bg-destructive-soft hover:text-destructive"
      >
        <Trash2 className="size-4.5" />
      </Button>
    </div>
  );
}
