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
import { buildSeedState } from "./seed";
import { toggleDelivery } from "./records";

/**
 * Single source of truth. Persists to localStorage today; swap `persistence`
 * for a remote backend later without touching any UI component.
 */
const STORAGE_KEY = "toleen-laundry-state-v1";

interface Persistence {
  load(): PersistedState | null;
  save(state: PersistedState): void;
}

const persistence: Persistence = {
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw) as Partial<PersistedState>;
      return {
        inventory: Array.isArray(p.inventory) ? p.inventory : [],
        services: Array.isArray(p.services) ? p.services : [],
        fourthLabel: typeof p.fourthLabel === "string" ? p.fourthLabel : "",
      };
    } catch {
      return null;
    }
  },
  save(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or disabled */
    }
  },
};

const SERVER_STATE: LaundryState = { inventory: [], services: [], fourthLabel: "", ready: false };

let current: LaundryState | null = null;
const listeners = new Set<() => void>();

function init(): LaundryState {
  if (current) return current;
  const loaded = persistence.load();
  const base = loaded ?? buildSeedState();
  if (!loaded) persistence.save(base);
  current = { ...base, ready: true };
  return current;
}

function setState(update: (s: PersistedState) => PersistedState) {
  const prev = init();
  const next = update(prev);
  current = { inventory: next.inventory, services: next.services, fourthLabel: next.fourthLabel, ready: true };
  persistence.save({ inventory: current.inventory, services: current.services, fourthLabel: current.fourthLabel });
  listeners.forEach((l) => l());
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
  restoreSeed() {
    setState(() => buildSeedState());
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
