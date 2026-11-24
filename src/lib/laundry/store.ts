import { useSyncExternalStore } from "react";
import type {
  InventoryInput,
  InventoryRecord,
  LaundryState,
  PersistedState,
  ServiceInput,
  ServiceRecord,
} from "./types";
import { nowISO, uid } from "./format";
import { removeSampleRecords } from "./seed";
import { toggleDelivery } from "./records";
import { readStored, serializeStored } from "./backup";

/**
 * Single source of truth. Persists to localStorage today; swap `persistence`
 * for a remote backend later without touching any UI component.
 */
const STORAGE_KEY = "toleen-laundry-state-v1";

interface Persistence {
  load(): PersistedState;
  /** Returns false when the device refused to save (storage full or blocked). */
  save(state: PersistedState): boolean;
}

const persistence: Persistence = {
  load() {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return readStored(null).state;
    }
    // Lenient: fills in fields added later (e.g. receipt date on older orders) and skips broken rows.
    const { state, preserveRaw } = readStored(raw);
    if (preserveRaw && raw) {
      // Keep an untouched copy before anything overwrites it, so no saved record is ever lost.
      try {
        const key = `${STORAGE_KEY}-recovered`;
        const prev = window.localStorage.getItem(key);
        if (prev !== raw) window.localStorage.setItem(prev === null ? key : `${key}-${Date.now()}`, raw);
      } catch {
        /* storage full */
      }
    }
    return state;
  },
  save(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeStored(state));
      return true;
    } catch {
      return false;
    }
  },
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
  current = { ...persistence.load(), ready: true };
  return current;
}

function setState(update: (s: PersistedState) => PersistedState) {
  const prev = init();
  const next = update(prev);
  current = { inventory: next.inventory, services: next.services, fourthLabel: next.fourthLabel, ready: true };
  const saved = persistence.save({ inventory: current.inventory, services: current.services, fourthLabel: current.fourthLabel });
  listeners.forEach((l) => l());
  if (!saved) saveErrorListeners.forEach((l) => l());
}

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  current = null;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function useLaundry(): LaundryState {
  return useSyncExternalStore(subscribe, init, () => SERVER_STATE);
}

export const laundry = {
  addInventory(input: InventoryInput) {
    const ts = nowISO();
    const rec: InventoryRecord = { ...input, id: uid(), isDelivered: false, deliveredAt: null, createdAt: ts, updatedAt: ts };
    setState((s) => ({ ...s, inventory: [rec, ...s.inventory] }));
  },
  updateInventory(id: string, input: InventoryInput) {
    setState((s) => ({
      ...s,
      inventory: s.inventory.map((r) => (r.id === id ? { ...r, ...input, updatedAt: nowISO() } : r)),
    }));
  },
  deleteInventory(id: string) {
    setState((s) => ({ ...s, inventory: s.inventory.filter((r) => r.id !== id) }));
  },
  toggleInventory(id: string) {
    const ts = nowISO();
    setState((s) => ({ ...s, inventory: s.inventory.map((r) => (r.id === id ? toggleDelivery(r, ts) : r)) }));
  },
  addService(input: ServiceInput) {
    const ts = nowISO();
    const rec: ServiceRecord = { ...input, id: uid(), isDelivered: false, deliveredAt: null, createdAt: ts, updatedAt: ts };
    setState((s) => ({ ...s, services: [rec, ...s.services] }));
  },
  updateService(id: string, input: ServiceInput) {
    setState((s) => ({
      ...s,
      services: s.services.map((r) => (r.id === id ? { ...r, ...input, updatedAt: nowISO() } : r)),
    }));
  },
  deleteService(id: string) {
    setState((s) => ({ ...s, services: s.services.filter((r) => r.id !== id) }));
  },
  toggleService(id: string) {
    const ts = nowISO();
    setState((s) => ({ ...s, services: s.services.map((r) => (r.id === id ? toggleDelivery(r, ts) : r)) }));
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
    setState(() => ({ inventory: next.inventory, services: next.services, fourthLabel: next.fourthLabel }));
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
  return useSyncExternalStore(subscribeQuery, () => query, () => "");
}
