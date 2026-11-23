import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="تعديل" title="تعديل">
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        aria-label="حذف"
        title="حذف"
        className="hover:bg-destructive-soft hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </div>
  );
}
