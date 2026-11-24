import { describe, expect, it } from "vitest";
import { isPreviewHost, shouldRegisterServiceWorker } from "./guard";

const live = { prod: true, inIframe: false, hostname: "toleen.lovable.app", search: "" };

describe("offline helper registration", () => {
  it("runs on the published app", () => {
    expect(shouldRegisterServiceWorker(live)).toBe(true);
  });
  it("runs on a custom domain", () => {
    expect(shouldRegisterServiceWorker({ ...live, hostname: "toleen-laundry.com" })).toBe(true);
  });
  it("never runs during development", () => {
    expect(shouldRegisterServiceWorker({ ...live, prod: false })).toBe(false);
  });
  it("never runs inside the editor frame", () => {
    expect(shouldRegisterServiceWorker({ ...live, inIframe: true })).toBe(false);
  });
  it("can be switched off with ?sw=off", () => {
    expect(shouldRegisterServiceWorker({ ...live, search: "?sw=off" })).toBe(false);
  });
  it("never runs on Lovable preview addresses", () => {
    expect(isPreviewHost("id-preview--7fd18b1d-c4ee-4c05-98e6-66e6fd73319f.lovable.app")).toBe(true);
    expect(isPreviewHost("preview-abc--shop.lovable.app")).toBe(true);
    expect(isPreviewHost("project--7fd18b1d-c4ee-4c05-98e6-66e6fd73319f-dev.lovable.app")).toBe(true);
    expect(isPreviewHost("x.lovableproject.com")).toBe(true);
    expect(isPreviewHost("preview-v2--shop.example.com")).toBe(false);
  });
});
