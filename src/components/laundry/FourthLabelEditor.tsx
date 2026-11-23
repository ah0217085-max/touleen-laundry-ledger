import { useState } from "react";
import { Check, Pencil, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { laundry, useLaundry } from "@/lib/laundry/store";
import { inputClass } from "./Field";

/** Optional sub-label shown under "الكوي" (the title itself stays fixed). */
export function FourthLabelEditor() {
  const { fourthLabel, ready } = useLaundry();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (!ready) return null;

  if (editing) {
    return (
      <form
        className="glass mb-3 flex items-center gap-2 rounded-2xl p-2"
        onSubmit={(e) => {
          e.preventDefault();
          laundry.setFourthLabel(draft);
          setEditing(false);
        }}
      >
        <input
          autoFocus
          value={draft}
          maxLength={40}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="تسمية فرعية اختيارية، مثال: كيّ وترتيب الملابس"
          aria-label="التسمية الفرعية"
          className={`${inputClass} h-10 flex-1 text-sm`}
        />
        <Button type="submit" variant="brand" size="icon-sm" aria-label="حفظ التسمية">
          <Check />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="إلغاء" onClick={() => setEditing(false)}>
          <X />
        </Button>
      </form>
    );
  }

  return (
    <div className="mb-3 flex items-center gap-2">
      {fourthLabel && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground">
          <Tag className="size-3.5" />
          {fourthLabel}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setDraft(fourthLabel);
          setEditing(true);
        }}
      >
        <Pencil />
        {fourthLabel ? "تعديل التسمية الفرعية" : "إضافة تسمية فرعية"}
      </Button>
    </div>
  );
}
