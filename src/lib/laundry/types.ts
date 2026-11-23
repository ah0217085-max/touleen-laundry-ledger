export type InventorySectionKey = "carpets" | "blankets";
export type ServiceSectionKey = "tailoring" | "washing" | "fourth";
export type SectionKey = InventorySectionKey | ServiceSectionKey;

interface BaseRecord {
  id: string;
  customerName: string;
  invoiceAmount: number;
  isDelivered: boolean;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Carpets / blankets: counted pieces with a received date. */
export interface InventoryRecord extends BaseRecord {
  sectionKey: InventorySectionKey;
  customerNumber: string;
  itemCount: number;
  receivedDate: string; // YYYY-MM-DD
}

/** Tailoring / washing / fourth-view orders. */
export interface ServiceRecord extends BaseRecord {
  sectionKey: ServiceSectionKey;
  phoneNumber: string;
  serviceDetails: string;
}

type SystemFields = "id" | "isDelivered" | "deliveredAt" | "createdAt" | "updatedAt";
export type InventoryInput = Omit<InventoryRecord, SystemFields>;
export type ServiceInput = Omit<ServiceRecord, SystemFields>;

export type StatusFilter = "all" | "pending" | "delivered";

export interface PersistedState {
  inventory: InventoryRecord[];
  services: ServiceRecord[];
  fourthLabel: string;
}

export interface LaundryState extends PersistedState {
  /** False until browser storage has been read (always false during SSR). */
  ready: boolean;
}
