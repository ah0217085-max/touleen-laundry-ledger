// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Build output for browser files; the offline helper must be written next to them, and only once.
const CLIENT_OUT = "dist/client";
// Icons and the manifest are copied after the client bundle, so list them for offline storage by hand.
const PUBLIC_SHELL = [
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "favicon.png",
];
const publicEntry = (url: string) => ({
  url,
  revision: createHash("md5")
    .update(readFileSync(`public/${url}`))
    .digest("hex"),
});
const clientOnly = (plugins: Plugin[]): Plugin[] =>
  plugins.map((p) => ({ ...p, applyToEnvironment: (env) => env.name === "client" }));

export default defineConfig({
  vite: {
    server: {
      host: "0.0.0.0",
      port: 3000,
      allowedHosts: true,
    },
  },
  // On Netlify the app needs its server-rendering function, so build with Nitro's Netlify preset
  // (static files stay in dist/client, the publish directory). Elsewhere keep the Node server build.
  nitro: process.env["NETLIFY"]
    ? {
        preset: "netlify",
        output: { publicDir: "dist/client" },
      }
    : {
        preset: "node-server",
        output: {
          dir: "dist",
          serverDir: "dist/server",
          publicDir: "dist/client",
        },
      },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  plugins: [
    // Offline shell for the installed app. Registered only by src/lib/pwa/register.ts (never in dev/preview).
    ...clientOnly(
      VitePWA({
        outDir: CLIENT_OUT,
        strategies: "generateSW",
        filename: "sw.js",
        registerType: "autoUpdate",
        injectRegister: null,
        manifest: false, // public/manifest.webmanifest is the single manifest
        devOptions: { enabled: false },
        workbox: {
          globDirectory: CLIENT_OUT,
          globPatterns: ["**/*.{js,css,png,svg,ico,webmanifest,woff2}"],
          additionalManifestEntries: PUBLIC_SHELL.map(publicEntry),
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              // Pages: always try the network first, fall back to the last copy when offline.
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: {
                cacheName: "toleen-pages",
                networkTimeoutSeconds: 4,
                cacheableResponse: { statuses: [200] },
                expiration: { maxEntries: 20 },
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "toleen-fonts",
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      }),
    ),
  ],
});
