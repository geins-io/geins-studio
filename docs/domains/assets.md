# Assets Domain

> Media/asset library: grid + list browse, folder-scoped filtering, upload, and a slide-in detail/edit panel.
> For system architecture, see `ARCHITECTURE.md`. For app-level routing, see `APP.md`.

---

## Purpose

The Assets domain manages media files (images, SVGs, documents, PDFs, video, audio) and the folders that organise them. Assets carry metadata (name, description, localized alt text, tags, publication channels) and are referenced by other domains (product images, CMS). The UI is a workspace-level library at `/asset-library` with grid and list views and a slide-in editing panel.

**Status:** v0 is built against a **Supabase-backed mock API** — the real Geins Management API does not yet serve assets. The frozen contract below is what makes that mock swappable (see [Mock → real swap](#mock--real-swap)).

## Key Concepts

**Folder = backend category filter** — Folders are an adjacency list (`parentFolderId`, self-referential). A folder is not client-side tree math: selecting one sends a `folderId` filter to the API, which returns that folder **plus all descendants**. Two locked **system folders** (`Uncategorised`, `Archived`, `system: true`) are server-owned and not user-creatable; "All assets" is a UI concept (no filter), not a row.

**Asset types** (`AssetType`) — `image | svg | doc | pdf | video | audio | other`. Drives the type badge and thumbnail rendering.

**Localized fields** (`localizations`) — Translatable text follows the product-standard shape: `localizations: Localized<AssetLocalizations>` = `{ en: { description, altText }, sv: { description, altText } }` (locale → fields). Both **`description`** and **`altText`** are per-locale. The top-level `description` / `altText` on the returned `Asset` are the **default-language** values, **derived server-side** from `localizations` (single source of truth; the mapper reads `localizations[DEFAULT_LANG].*`, with `description` falling back to the legacy top-level column for pre-migration rows). Writes send `localizations` (a **full replace** — a missing locale/field is cleared, matching `assetLocalizationsRequest`); `description` is still accepted top-level on the **create** path (`AssetCreate`). The upload path carries no metadata (see **Upload** below) — the wizard persists description + alt text with a follow-up `PATCH` after the files land. Available locales come from the **account/channel language setup**, feeding the global translation panel. (`LocalizedText` — a plain locale→string map — is the per-field shape the translation panel UI edits.)

**Channels** — String tags marking where an asset is published (web, mobile, …).

**Optimistic concurrency** (`etag` / `If-Match`) — Each `Asset` carries an opaque `etag`. The detail panel round-trips it as an `If-Match` header on `assetApi.update` (via `RepoFetchOptions.headers`), so a save against a version someone else already changed fails with **`412 Precondition Failed`** instead of silently overwriting. `412` is excluded from the global error toast (like `401`); the panel shows an inline "changed elsewhere — reload" alert and discards the stale copy on reload. The mock derives the etag from `updated_at` and bumps it on every PATCH (`cutover:` — the real API owns this).

**Browse state in the URL** — the library page reflects the selected folder + grid pagination in the query (`?folder=<id>&page=<n>&perPage=<n>`, defaults omitted) so a link opens the exact folder + page. The grid uses [`PaginationBar`](/components/PaginationBar) (page-size + page nav, matching the table); the list view paginates via `TableView`.

## Asset picker

A wide slide-in panel that lets any entity **link** assets from the library (product images, attachments, …). It **links, never copies** — the library stays the single source of truth; the picker only hands back the chosen `Asset` objects and the consumer stores their ids. Confirming resolves the selection; cancel/close resolves `[]` and leaves the caller's model untouched.

One panel instance lives app-wide ([`AssetPickerHost`](/components/asset/AssetPickerHost), mounted in `app.vue`); every caller drives that shared instance — never place a picker on a page directly.

**Public API — two styles:**

- **Imperative** — [`useAssetPicker`](/composables/useAssetPicker): `const assets = await open(options)`. Resolves with the chosen assets, or `[]` on cancel/close (never rejects, so no try/catch). A second `open` while one is in flight returns the same promise.
- **Declarative** — [`AssetPicker`](/components/asset/AssetPicker): wrap a trigger (`<AssetPicker v-model="images"><Button>Pick</Button></AssetPicker>`); the chosen assets flow back through `v-model` + the `confirm` emit. `preselectedIds` defaults to the current model's ids, so a re-open shows them as "Linked".

**Options** (`AssetPickerOptions`, all optional):

| Option           | Effect                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `multiple`       | Multi-select (default) vs single — single replaces the pick on each click.                                                     |
| `types`          | Allowed `AssetType`s (`null` = all). Disallowed types are filtered out entirely. A files-only scope defaults to the list view. |
| `preselectedIds` | Already-linked ids — shown checked with a "Linked" tag; the confirm button counts only **new** picks.                          |
| `title`          | Panel title override.                                                                                                          |
| `folderId`       | Initial folder scope (server-side filter).                                                                                     |

Folder scope is a server-side filter (matching the library page); search / type-scope / sort / paginate are client-side over the fetched folder list. Quick-upload ([`AssetUploadDialog`](/components/asset/AssetUploadDialog) `quick` method) is available inline — new assets matching the picker's types auto-select and the rail flips to "Recently added".

The [`AssetPickerPanel`](/components/asset/AssetPickerPanel) is not a `PanelEdit` (no unsaved-changes semantics) — it's a plain wide `Sheet` with a custom selection footer.

## API Contract

The contract is **camelCase + `_id`/`_type`** (via `ResponseEntity`), mirroring the rest of the Management API. It is independent of the storage backend — the mock maps to it (see below).

> **Phase 8 alignment (STU-326).** Ahead of the real `Geins.Media` backend, the mock pre-emits its wire fields: `Asset._type` is `'geins.asset'`, each `Asset` carries `path` (= `folderPath`/`name`) and `folderPath` (owning folder's full path; `null` at root), and each `Folder` carries `path` + `depth` (segment count; 1 = top level). Derived server-side in the mappers via `folderPathIndex` / `loadFolderPaths` ([assets-mock.ts](server/utils/assets-mock.ts)). Fields the real phase 1 drops (`sortOrder`, `system`, and the metadata group) still ship from the mock until cutover — see the Phase 8 milestone. Every temporary Phase 8 addition is logged in the [cutover ledger](./assets-cutover.md) (`grep cutover:`) so nothing rots at swap time.

| Method & path                      | Repo call                           | Body / query                              | Returns                  |
| ---------------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------ |
| `POST /asset/query`                | `assetApi.list(opts)`               | `assetQuery` (`all: true`, `folderIds[]`) | `Asset[]`                |
| `GET /asset/:id`                   | `assetApi.get(id)`                  | —                                         | `Asset`                  |
| `POST /asset`                      | `assetApi.create(data)`             | `AssetCreate`                             | `Asset`                  |
| `PATCH /asset/:id`                 | `assetApi.update(id, data)`         | `AssetUpdate`                             | `Asset`                  |
| `DELETE /asset/:id`                | `assetApi.delete(id)`               | —                                         | `null`                   |
| `POST /asset/tickets`              | `assetApi.uploadViaTickets(items)`  | `{ files: UploadTicketFile[] }`           | `UploadTicketResponse`   |
| `PUT <plan url>` (bytes)           | ↳ raw `fetch` (no proxy)            | file bytes + Azure blob headers           | `—`                      |
| `POST /asset/tickets/:id/complete` | ↳ same method                       | `{ files: clientRef[] }`                  | `UploadCompleteResponse` |
| `POST /asset/:id/replace`          | `assetApi.replace(id, fd)`          | multipart single file                     | `Asset`                  |
| `GET /asset/folder/list`           | `assetApi.folder.list()`            | —                                         | `Folder[]`               |
| `GET /asset/folder/:id`            | `assetApi.folder.get(id)`           | —                                         | `Folder`                 |
| `POST /asset/folder`               | `assetApi.folder.create(d)`         | `FolderCreate`                            | `Folder`                 |
| `PATCH /asset/folder/:id`          | `assetApi.folder.update(…)`         | `FolderUpdate` (rename / move)            | `Folder`                 |
| `DELETE /asset/folder/:id`         | `assetApi.deleteFolder(id, assets)` | `?assets=move\|delete` (default `move`)   | `null`                   |

- **List query:** `assetApi.list()` POSTs the real `assetQuery` shape to `POST /asset/query` and unwraps `BatchQueryResult.items`. Fetch-all is `all: true` (the real schema caps `pageSize` at 1000 — no huge page size); sort / paginate / search stay client-side via TanStack (app-wide convention). Still guard with `Array.isArray()` before `.map()` (per the repository rules in `CLAUDE.md`).
- **`folderIds` filtering** goes over the wire as `folderIds: [id]` (a `null` element = library root) and resolves the selected folder + descendants server-side; omitted entirely for the "all assets" view.
- **Asset delete is backend-defined.** The mock hard-deletes the row; real `DELETE /media/assets/{id}` moves the asset to **trash** (soft delete), recoverable via `POST /media/assets/{id}/restore`, with an **either-or** `trashed` filter on `assetQuery`: omitted (what we send) or `false` returns live assets only, `true` returns only trashed ones. Trashed assets are hard-deleted after a 30-day retention window (configurable, server-side). Either backend therefore drops the asset out of the default library list, and `deleteAsset` refreshes `asset-library-list` either way — so the UI tolerates both. The copy is therefore **neutral on permanence**: `asset_delete_confirm_description` overrides the shared `dialog.delete_confirm_description` ("permanently delete … cannot be undone") at both delete sites ([`AssetDetailPanel`](/components/asset/AssetDetailPanel) + the library page) via [`DialogDelete`](/components/dialog/DialogDelete)'s `description` prop. A Trash view + Restore action is not built — see the [cutover ledger](./assets-cutover.md).
- **Folder delete:** the caller picks what happens to the assets inside via `?assets`. `move` (default) re-homes them to uncategorised (`folder_id` FK is `ON DELETE SET NULL`); `delete` removes the whole folder + descendant subtree's assets first. Child folders cascade in both cases. The UI ([`AssetFolderDeleteDialog`](/components/asset/AssetFolderDeleteDialog)) only prompts for the choice when the subtree still holds assets; empty folders use the plain `DialogDelete` (`assetApi.folder.delete` — the move-only default).
  - **Empty-only under `media-phase1`**, gated on `useAssetCapabilities().canDeleteFolderWithAssets`: real phase 1 has no disposition — `DELETE /media/folders/{id}` deletes an **empty** folder and answers `409 FOLDER_NOT_EMPTY` otherwise. With the capability off, [`AssetFolderTree`](/components/asset/AssetFolderTree) skips the subtree count probe and the choice dialog, calls `assetApi.folder.delete(id)` with `suppressErrorToast: true`, and renders the `409` (or any other failure) as the confirm dialog's warning callout instead of a toast. The richer dialog stays for the mock and for phase 2.
- **Upload (3-step ticket flow):** both the quick dialog and the wizard call `assetApi.uploadViaTickets(items)`, mirroring `Geins.Media`: **(1)** `POST /asset/tickets` claims a ticket — each file's claim carries only `name` / `folderId` / `sizeBytes` / `mimeType` / `overwrite` (**no metadata**) and comes back `accepted` (with a per-file upload plan URL) or `rejected` (with a code). **(2)** each accepted file's bytes are `PUT` **straight to the plan URL** via raw `globalThis.fetch` (not `$geinsApi` — the plan URL is a storage endpoint, not the API proxy), with the Azure blob headers `x-ms-blob-type: BlockBlob` + `x-ms-blob-content-type` alongside `content-type`. **(3)** `POST /asset/tickets/:id/complete` publishes the uploaded bytes as asset rows. The mock stores in the `assets` bucket, derives `sizeBytes` / `mime` / `AssetType` (`mimeToAssetType`), and reuses the original as `thumbUrl` for images + SVGs (v0). Deleting an asset removes the row, not the stored object (mock — harmless).
  - **Validate + chunk before claiming:** the repo enforces the ticket caps client-side (from `#shared/utils/asset`: ≤ `MAX_FILES_PER_TICKET` = 50 files, ≤ `MAX_TICKET_BYTES` = 10 GB per ticket, ≤ `MAX_FILE_BYTES` = 1 GB per file). A file over the per-file cap is rejected client-side (never claimed); the rest are packed into batches within the count + total caps, each batch its own ticket — so a large selection never trips the claim's `400`.
  - **Per-file outcomes:** `uploadViaTickets` returns merged `UploadCompleteResult[]` (completed + rejected, keyed by `clientRef`) — the ticket + complete stages are always HTTP 200 with per-file results, so a partial failure is not a request error. The UI maps each rejection **code** to friendly, translatable copy via `uploadRejectionMessageKey` (the wizard lists every rejection on its result screen; the quick dialog toasts a summary and shows reasons inline only when _nothing_ landed).
  - **Metadata persistence:** phase-1 tickets carry no metadata, so the **wizard** persists description + localized alt text with a follow-up `PATCH /asset/:id` per created asset (If-Match with the new etag), **gated on `useAssetCapabilities().canEditDescriptionAltText`**. **name + folder** ride the ticket claim (persisted at create); **tags + channels** have no phase-1 route and are disabled in the wizard's metadata step (values are still held in wizard state — nothing is lost if a later phase enables them). The quick dialog uploads bare (files + folder, no metadata).
- **Replace:** `POST /asset/:id/replace` (multipart, single file) uploads the new file and repoints the existing row's file columns (`url` / `thumbUrl` / `sizeBytes` / `mime` / `type`), keeping the same id, name, and metadata. The old stored object is left in place (mock — harmless). Returns the updated `Asset`.

## Mock backend (Supabase)

The mock lives entirely under `server/` and never reaches the client:

- **`server/utils/assets-mock.ts`** — server-only Supabase client (secret/`service_role` key from `runtimeConfig.private`, **bypasses RLS**), the `toAsset`/`toFolder` + `assetColumns`/`folderColumns` mappers, and `descendantFolderIds`.
- **`server/api/asset/**`** — dedicated Nitro routes that intercept before the catch-all proxy (`server/api/[...].ts`).
- **`supabase/migrations/0001_assets_mock.sql`** — schema, RLS (enabled, **no policies** → public data API denied, server key bypasses), public storage buckets (`assets`, `asset-thumbnails`), and seed data.
- **`supabase/migrations/0003_asset_localizations.sql`** — migrates `alt_text` (locale→string) to `localizations` (locale→fields) and drops `alt_text`. Idempotent; run it in the SQL editor before the localizations changes work.

**Casing is the contract boundary.** Postgres columns are idiomatic `snake_case`; the routes **map** rows to the camelCase contract and never return raw rows (a raw PostgREST proxy would leak `snake_case`).

| Contract (camelCase)      | Column (snake_case)                  |
| ------------------------- | ------------------------------------ |
| `_id`                     | `id`                                 |
| `_type`                   | _(literal `'asset'` / `'folder'`)_   |
| `folderId`                | `folder_id`                          |
| `thumbUrl`                | `thumb_url`                          |
| `sizeBytes`               | `size_bytes`                         |
| `localizations`           | `localizations` (jsonb)              |
| `altText` (derived)       | _(from `localizations[en].altText`)_ |
| `parentFolderId`          | `parent_id`                          |
| `sortOrder`               | `sort_order`                         |
| `createdAt` / `updatedAt` | `created_at` / `updated_at`          |

## Transport — which backend the client talks to (STU-330)

`NUXT_PUBLIC_ASSETS_BACKEND` switches the **whole library** between the Supabase mock and real Geins.Media, at runtime config level:

| Value            | Routes                                              | Notes                                                                 |
| ---------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| `mock` (default) | `/asset`, `/asset/folder`, `/asset/tickets`         | Nitro mock routes under `server/api/asset/**`. Every capability on.   |
| `media-phase1`   | `/media/assets`, `/media/folders`, `/media/tickets` | Catch-all proxy → Geins Media API. Phase-1 capability gating applies. |

The routes come from [`assetEndpoints(backend)`](shared/utils/asset.ts) — the same flag that drives [`useAssetCapabilities`](/composables/useAssetCapabilities), so transport and feature gating can never disagree. The entity registry (`ENTITIES.asset` / `ENTITIES.folder`) holds the **real** paths; the mock is the temporary override that dies at final cutover.

The real surface is not the mock's paths with a prefix swapped — verified against the shipped QA OpenAPI (`Geins Media API 1.0.0`):

- **`GET /media/folders`** lists folders at the collection root, not the Management API's `{base}/list`.
- **`PUT /media/folders/{id}`** replaces a folder (name + parent together); the mock takes a partial `PATCH`.
- **`POST /media/tickets`** is a sibling of assets, not `…/assets/tickets`.
- No `/tags` and no `/replace` route exists — both are already gated off under `media-phase1`.
- Real assets carry **no `tags` and no `channels` fields at all** (the mock always sends arrays), so both are optional on `AssetBase`. Every read site must tolerate `undefined` — a bare `asset.tags.length` in `AssetCard` blanked the entire grid when the first real assets landed (the render error tears down the subtree; the pagination footer outside it survives, which is what the symptom looks like).
- Folders follow `media_response_folder`: `path` (lowercased full path, **not** `fullPath`), `depth`, `createdBy`/`createdAt`/`updatedAt`. `sortOrder` and `system` (Uncategorised / Archived) exist **only** in the mock and are optional on the type.
- A folder update is a **full replace** — real `PUT /media/folders/{id}` requires `name` on every call, so `FolderUpdate` is `CreateEntity<FolderBase>`: a move sends the current name, a rename sends the current `parentFolderId`. (No rename/move UI exists yet.)
- `thumbUrl` comes back as `''`. `AssetThumbnail` / `TableCellAssetThumbnail` therefore preview the full-size `url` for `image`/`svg` assets (`assetPreviewUrl`), so the library shows pictures rather than a wall of type icons. Full-size files in grid tiles is the trade-off until Geins.Media serves thumbnails.

`x-account-key` needs **no** transport work: [`geins-api.ts`](app/plugins/geins-api.ts) sets it on every request from the session's account key, and the catch-all proxy forwards headers verbatim. The real API also accepts `x-functions-key` (Azure function app key) for direct function-host access — not used when calls go through the Geins gateway.

### What is left at final cutover

1. Delete `server/api/asset/`, `server/utils/assets-mock.ts`, `server/utils/upload-tickets.ts`.
2. Remove `supabaseUrl` / `supabaseServiceKey` from `nuxt.config.ts` (`runtimeConfig.private`) and the `.env` keys; drop `@supabase/supabase-js` if unused elsewhere; delete `supabase/migrations/` and retire the Supabase project.
3. Drop the `mock` branch of `assetEndpoints` (repos read `ENTITIES.asset` / `ENTITIES.folder` again) and the `assetsBackend` config once phase 2 also retires the capability gating.

Folder shape parity (STU-353) shipped with the switch — see the two folder bullets above and the [cutover ledger](./assets-cutover.md).

## Dependencies

- **Depends on**: account/channel language setup (alt-text locales).
- **Depended on by**: (future) Products (product images), CMS. Usage tracking ("Used in") is deferred post-v0 — data not available.

## Key Files

| Layer      | Path                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| Types      | `shared/types/Asset.ts` (Asset + Folder)                                                 |
| Registry   | `shared/utils/entities.ts` (`asset`, `folder`)                                           |
| Repository | `app/utils/repositories/asset.ts` (`assetApi`, `.folder` sub-repo)                       |
| Mock API   | `server/api/asset/**`, `server/utils/assets-mock.ts`                                     |
| Migration  | `supabase/migrations/0001_assets_mock.sql`                                               |
| Pages      | `app/pages/asset-library/index.vue` (grid + list browse, folder nav, detail panel)       |
| Picker     | `app/composables/useAssetPicker.ts`, `app/components/asset/AssetPicker{,Host,Panel}.vue` |

## Decision Log

**2026-07: Supabase-backed mock, not a live API**
No Management API for assets exists yet. A Supabase mock behind Nitro routes lets the full frontend (types, registry, repos, UI) be built against a frozen contract and swapped later with no churn.

**2026-07: Folder as a backend category filter**
Folder filtering (self + descendants) resolves server-side rather than as client tree math, so the list page stays a plain filtered query and the behaviour survives the swap to the real API.

**2026-07: Slide-in detail panel as a new Studio convention**
Asset editing uses a slide-in panel (seeded from Buyer-on-Company), not a dedicated `[id].vue` route. Formalized as a reusable global primitive in Phase 2.
