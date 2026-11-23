import type { InventorySectionKey, SectionKey, ServiceSectionKey } from "./types";

export const SECTION_LABELS: Record<SectionKey, string> = {
  carpets: "السجاد",
  blankets: "الحرامات",
  tailoring: "التصليح والخياطة",
  washing: "الغسيل",
  fourth: "الكوي",
};

export const ITEM_COUNT_LABELS: Record<InventorySectionKey, string> = {
  carpets: "عدد السجاد",
  blankets: "عدد الحرامات",
};

export const SERVICE_DETAILS_LABELS: Record<ServiceSectionKey, string> = {
  tailoring: "تفاصيل التصليح",
  washing: "تفاصيل الغسيل",
  fourth: "تفاصيل الكوي",
};
