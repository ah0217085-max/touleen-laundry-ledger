import { shouldRegisterServiceWorker } from "./guard";

/** The only place the offline helper is registered. Call from an effect, never at import time. */
const SW_PATH = "/sw.js";

function inIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

async function unregisterAppWorker() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => {
        const url = (r.active ?? r.waiting ?? r.installing)?.scriptURL;
        return !!url && new URL(url).pathname === SW_PATH;
      })
      .map((r) => r.unregister()),
  );
}

export async function setupOfflineSupport(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const allowed = shouldRegisterServiceWorker({
    prod: import.meta.env.PROD,
    inIframe: inIframe(),
    hostname: window.location.hostname,
    search: window.location.search,
  });
  try {
    if (!allowed) {
      await unregisterAppWorker();
      return;
    }
    await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
  } catch {
    /* offline support is optional; the app keeps working without it */
  }
}

/** Asks the browser not to clear this app's saved records when the phone runs low on space. */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* not supported */
  }
}
