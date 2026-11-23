<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- App data lives in one module store (`src/lib/laundry/store.ts`) persisted to localStorage via a swappable `persistence` object; UI reads it only through `useLaundry()` so a remote backend can replace storage without UI changes.
- Business rules (validation, delivery toggle, filters, stats) are pure functions in `src/lib/laundry/` with tests in `laundry.test.ts`; keep UI components free of rule logic.
- Each of the 5 main sections is its own route file sharing the shell in `__root.tsx` (header + `MainNav`), so every view has its own URL and head metadata.
- The store renders an empty `ready: false` snapshot during SSR; views show skeletons until the browser snapshot loads, avoiding hydration mismatches.
- PWA is manifest-only (no service worker) until offline support is explicitly requested.
- Stored and imported data both pass through the normalizers in `src/lib/laundry/backup.ts` (lenient on load, strict on JSON import) so older saved records gain new fields without losing data.
- Phone link building (tel/wa.me, country-code normalization) lives in `src/lib/laundry/contact.ts`; `ContactActions` only renders its result.
