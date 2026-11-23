import {
  BedDouble,
  ChartColumn,
  Grid2x2,
  Layers,
  Scissors,
  Shirt,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";
import type { SectionKey } from "@/lib/laundry/types";

export const SECTION_ICONS: Record<SectionKey, LucideIcon> = {
  carpets: Grid2x2,
  blankets: BedDouble,
  tailoring: Scissors,
  washing: WashingMachine,
  fourth: Shirt,
};

export const NAV_ICONS = {
  inventory: Layers,
  tailoring: Scissors,
  washing: WashingMachine,
  fourth: Shirt,
  stats: ChartColumn,
} satisfies Record<string, LucideIcon>;
