/** Pure decision: may the offline helper (service worker) run here? Never in development or Lovable previews. */
const PROJECT_ID = "7fd18b1d-c4ee-4c05-98e6-66e6fd73319f";
const PREVIEW_PARENTS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const EDITOR_DOMAINS = ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"];

export function isPreviewHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (EDITOR_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) return true;
  const parent = PREVIEW_PARENTS.find((p) => host.endsWith(p));
  if (!parent) return false;
  const label = host.split(".")[0] ?? "";
  return PREVIEW_LABEL.test(label) || label === `project--${PROJECT_ID}-dev`;
}

export interface SwContext {
  prod: boolean;
  inIframe: boolean;
  hostname: string;
  search: string;
}

export function shouldRegisterServiceWorker(ctx: SwContext): boolean {
  if (!ctx.prod || ctx.inIframe) return false;
  if (new URLSearchParams(ctx.search).get("sw") === "off") return false;
  return !isPreviewHost(ctx.hostname);
}
