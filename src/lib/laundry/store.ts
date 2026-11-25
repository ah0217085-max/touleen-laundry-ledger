import { useSyncExternalStore } from "react";
import type {
  InventoryInput,
  InventoryRecord,
  LaundryState,
  PersistedState,
  ServiceInput,
  ServiceRecord,
} from "./types";
import { nowISO, toISODate, uid } from "./format";
import { removeSampleRecords } from "./seed";
import { toggleDelivery } from "./records";
import { onSecurityDataChange, saveSecurityRecords, securityRecords } from "../security/session";

/**
 * Single source of truth. Persists to localStorage today; swap `persistence`
 * for a remote backend later without touching any UI component.
 */
interface Persistence {
  load(): PersistedState | null;
  /** Returns false when the device refused to save (storage full or blocked). */
  save(state: PersistedState): Promise<boolean>;
}

const persistence: Persistence = {
  load: securityRecords,
  save: saveSecurityRecords,
};

const SERVER_STATE: LaundryState = { inventory: [], services: [], fourthLabel: "", ready: false };

let current: LaundryState | null = null;
const listeners = new Set<() => void>();
const saveErrorListeners = new Set<() => void>();

/** Lets the app shell tell the owner when a change could not be saved on the device. */
export function onSaveError(listener: () => void) {
  saveErrorListeners.add(listener);
  return () => {
    saveErrorListeners.delete(listener);
  };
}

function init(): LaundryState {
  if (current) return current;
  const loaded = persistence.load();
  if (!loaded) return SERVER_STATE;
  current = { ...loaded, ready: true };
  return current;
}

function setState(update: (s: PersistedState) => PersistedState) {
  const prev = init();
  if (!prev.ready) return;
  const next = update(prev);
  current = {
    inventory: next.inventory,
    services: next.services,
    fourthLabel: next.fourthLabel,
    ready: true,
  };
  void persistence
    .save({
      inventory: current.inventory,
      services: current.services,
      fourthLabel: current.fourthLabel,
    })
    .then((saved) => {
      if (!saved) saveErrorListeners.forEach((l) => l());
    });
  listeners.forEach((l) => l());
}

onSecurityDataChange(() => {
  current = null;
  setSearchQuery("");
  listeners.forEach((l) => l());
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLaundry(): LaundryState {
  return useSyncExternalStore(subscribe, init, () => SERVER_STATE);
}

export const laundry = {
  addInventory(input: InventoryInput) {
    const ts = nowISO();
    const today = toISODate(new Date(ts));
    const receivedDate = input.receivedDate || today;
    const receivedAt = input.receivedAt ?? (receivedDate === today ? ts : null);
    const rec: InventoryRecord = {
      ...input,
      receivedDate,
      ...(receivedAt ? { receivedAt } : {}),
      id: uid(),
      isDelivered: false,
      deliveredAt: null,
      createdAt: ts,
      updatedAt: ts,
    };
    setState((s) => ({ ...s, inventory: [rec, ...s.inventory] }));
  },
  updateInventory(id: string, input: InventoryInput) {
    setState((s) => ({
      ...s,
      inventory: s.inventory.map((r) => {
        if (r.id !== id) return r;
        const dateChanged = input.receivedDate !== r.receivedDate;
        const nextReceivedAt = dateChanged ? null : (input.receivedAt ?? r.receivedAt);
        return {
          ...r,
          ...input,
          ...(nextReceivedAt !== undefined ? { receivedAt: nextReceivedAt } : {}),
          updatedAt: nowISO(),
        };
      }),
    }));
  },
  deleteInventory(id: string) {
    setState((s) => ({ ...s, inventory: s.inventory.filter((r) => r.id !== id) }));
  },
  toggleInventory(id: string) {
    const ts = nowISO();
    setState((s) => ({
      ...s,
      inventory: s.inventory.map((r) => (r.id === id ? toggleDelivery(r, ts) : r)),
    }));
  },
  addService(input: ServiceInput) {
    const ts = nowISO();
    const today = toISODate(new Date(ts));
    const receivedDate = input.receivedDate || today;
    const receivedAt = input.receivedAt ?? (receivedDate === today ? ts : null);
    const rec: ServiceRecord = {
      ...input,
      receivedDate,
      ...(receivedAt ? { receivedAt } : {}),
      id: uid(),
      isDelivered: false,
      deliveredAt: null,
      createdAt: ts,
      updatedAt: ts,
    };
    setState((s) => ({ ...s, services: [rec, ...s.services] }));
  },
  updateService(id: string, input: ServiceInput) {
    setState((s) => ({
      ...s,
      services: s.services.map((r) => {
        if (r.id !== id) return r;
        const dateChanged = input.receivedDate !== r.receivedDate;
        const nextReceivedAt = dateChanged ? null : (input.receivedAt ?? r.receivedAt);
        return {
          ...r,
          ...input,
          ...(nextReceivedAt !== undefined ? { receivedAt: nextReceivedAt } : {}),
          updatedAt: nowISO(),
        };
      }),
    }));
  },
  deleteService(id: string) {
    setState((s) => ({ ...s, services: s.services.filter((r) => r.id !== id) }));
  },
  toggleService(id: string) {
    const ts = nowISO();
    setState((s) => ({
      ...s,
      services: s.services.map((r) => (r.id === id ? toggleDelivery(r, ts) : r)),
    }));
  },
  setFourthLabel(label: string) {
    setState((s) => ({ ...s, fourthLabel: label.trim().slice(0, 40) }));
  },
  /** Removes only the demo customers older versions added; real records stay. */
  removeSamples() {
    setState((s) => removeSampleRecords(s));
  },
  /** Replaces every record, e.g. from a validated JSON backup. */
  replaceAll(next: PersistedState) {
    setState(() => ({
      inventory: next.inventory,
      services: next.services,
      fourthLabel: next.fourthLabel,
    }));
  },
};

/* Global search query (not persisted) */
let query = "";
const queryListeners = new Set<() => void>();
function subscribeQuery(l: () => void) {
  queryListeners.add(l);
  return () => queryListeners.delete(l);
}
export function setSearchQuery(q: string) {
  query = q;
  queryListeners.forEach((l) => l());
}
export function useSearchQuery(): string {
  return useSyncExternalStore(
    subscribeQuery,
    () => query,
    () => "",
  );
}
