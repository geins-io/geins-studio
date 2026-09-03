# Assets Domain

> Media/asset library: grid + list browse, folder-scoped filtering, upload, and a slide-in detail/edit panel.
> For system architecture, see `ARCHITECTURE.md`. For app-level routing, see `APP.md`.

---

## Purpose

The Assets domain manages media files (images, SVGs, documents, PDFs, video, audio) and the folders that organise them. Assets carry metadata (name, description, localized alt text, tags, publication channels) and are referenced by other domains (product images, CMS). The UI is a workspace-level library at `/asset-library` with grid and list views and a slide-in editing panel.

**Status:** v0 is built against a **Supabase-backed mock API** — the real Geins Management API does not yet serve assets. The frozen contract below is what makes that mock swappable (see [Mock → real swap](#mock--real-swap)).

## Key Concepts

**Folder = backend category filter** — Folders are an adjacency list (`parentId`, self-referential). A folder is not client-side tree math: selecting one sends a `folderId` filter to the API, which returns that folder **plus all descendants**. Two locked **system folders** (`Uncategorised`, `Archived`, `system: true`) are server-owned and not user-creatable; "All assets" is a UI concept (no filter), not a row.

**Asset types** (`AssetType`) — `image | svg | doc | pdf | video | audio | other`. Drives the type badge and thumbnail rendering.

**Localized fields** (`localizations`) — Translatable text follows the product-standard shape: `localizations: Localized<AssetLocalizations>` = `{ en: { altText }, sv: { altText } }` (locale → fields). The top-level `altText` on the returned `Asset` is the **default-language** value, **derived server-side** from `localizations` (single source of truth; the mapper reads `localizations[DEFAULT_LANG].altText`). Writes send `localizations` only. Available locales come from the **account/channel language setup**, feeding the global translation panel. (`LocalizedText` — a plain locale→string map — is still used inside the translation panel UI for a single field.)

**Channels** — String tags marking where an asset is published (web, mobile, …).

**Browse state in the URL** — the library page reflects the selected folder + grid pagination in the query (`?folder=<id>&page=<n>&perPage=<n>`, defaults omitted) so a link opens the exact folder + page. The grid uses [`PaginationBar`](/components/PaginationBar) (page-size + page nav, matching the table); the list view paginates via `TableView`.

## API Contract

The contract is **camelCase + `_id`/`_type`** (via `ResponseEntity`), mirroring the rest of the Management API. It is independent of the storage backend — the mock maps to it (see below).

> **Phase 8 alignment (STU-326).** Ahead of the real `Geins.Media` backend, the mock pre-emits its wire fields: `Asset._type` is `'geins.asset'`, each `Asset` carries `path` (= `folderPath`/`name`) and `folderPath` (owning folder's full path; `null` at root), and each `Folder` carries `fullPath` + `depth` (segment count; 1 = top level). Derived server-side in the mappers via `folderPathIndex` / `loadFolderPaths` ([assets-mock.ts](server/utils/assets-mock.ts)). Fields the real phase 1 drops (`sortOrder`, `system`, and the metadata group) still ship from the mock until cutover — see the Phase 8 milestone. Every temporary Phase 8 addition is logged in the [cutover ledger](./assets-cutover.md) (`grep cutover:`) so nothing rots at swap time.

| Method & path              | Repo call                           | Body / query                            | Returns    |
| -------------------------- | ----------------------------------- | --------------------------------------- | ---------- |
| `GET /asset/list`          | `assetApi.list(opts)`               | `?folderId`, `?search`                  | `Asset[]`  |
| `GET /asset/:id`           | `assetApi.get(id)`                  | —                                       | `Asset`    |
| `POST /asset`              | `assetApi.create(data)`             | `AssetCreate`                           | `Asset`    |
| `PATCH /asset/:id`         | `assetApi.update(id, data)`         | `AssetUpdate`                           | `Asset`    |
| `DELETE /asset/:id`        | `assetApi.delete(id)`               | —                                       | `null`     |
| `POST /asset/upload`       | `assetApi.upload(formData)`         | multipart files + `folderId`            | `Asset[]`  |
| `POST /asset/:id/replace`  | `assetApi.replace(id, fd)`          | multipart single file                   | `Asset`    |
| `GET /asset/folder/list`   | `assetApi.folder.list()`            | —                                       | `Folder[]` |
| `GET /asset/folder/:id`    | `assetApi.folder.get(id)`           | —                                       | `Folder`   |
| `POST /asset/folder`       | `assetApi.folder.create(d)`         | `FolderCreate`                          | `Folder`   |
| `PATCH /asset/folder/:id`  | `assetApi.folder.update(…)`         | `FolderUpdate` (rename / move)          | `Folder`   |
| `DELETE /asset/folder/:id` | `assetApi.deleteFolder(id, assets)` | `?assets=move\|delete` (default `move`) | `null`     |

- **List envelope:** bare arrays today. Consumers must still guard with `Array.isArray()` / a normalizer before `.map()` — the real API may wrap in `{ items }` (per the repository rules in `CLAUDE.md`).
- **`folderId` filtering** resolves the selected folder + descendants server-side.
- **Folder delete:** the caller picks what happens to the assets inside via `?assets`. `move` (default) re-homes them to uncategorised (`folder_id` FK is `ON DELETE SET NULL`); `delete` removes the whole folder + descendant subtree's assets first. Child folders cascade in both cases. The UI ([`AssetFolderDeleteDialog`](/components/asset/AssetFolderDeleteDialog)) only prompts for the choice when the subtree still holds assets; empty folders use the plain `DialogDelete` (`assetApi.folder.delete` — the move-only default).
- **Upload:** `POST /asset/upload` (multipart) stores each file in the `assets` bucket server-side (service key), derives `sizeBytes` / `mime` / `AssetType` (`mimeToAssetType`), builds the public URL, inserts the row, and returns the created `Asset[]`. Images and SVGs reuse the original as `thumbUrl` (both render in an `<img>`; v0). Deleting an asset removes the row, not the stored object (mock — orphaned objects are harmless).
  - **Per-file metadata:** the upload wizard sends a `meta` field alongside the file parts — a JSON array of [`AssetUploadMeta`](/../shared/types/Asset.ts) (`{ name?, folderId?, description?, tags?, channels?, localizations? }`), **one entry per file in the same order** — and each is persisted on its asset row. The quick-upload dialog omits `meta` and sends a single `folderId` field applied to all files (the per-file `folderId` falls back to it). **This extends the frozen contract**: when the real API serves `/asset/upload` it must accept the same per-file `meta` payload (or the wizard's submit + `assetApi.upload` FormData must be re-mapped to whatever shape it expects).
  - **Partial success:** a per-file failure is skipped rather than aborting the batch; the route returns the created subset and only errors (→ global toast) when _nothing_ was stored. The caller compares `created.length` to the sent count to report a shortfall.
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
| `parentId`                | `parent_id`                          |
| `sortOrder`               | `sort_order`                         |
| `createdAt` / `updatedAt` | `created_at` / `updated_at`          |

## Mock → real swap

When the Management API serves `/asset`:

1. Delete `server/api/asset/` and `server/utils/assets-mock.ts`. The catch-all proxy then forwards `/asset` to the real API.
2. Remove `supabaseUrl` / `supabaseServiceKey` from `nuxt.config.ts` (`runtimeConfig.private`) and the `.env` keys; drop `@supabase/supabase-js` if unused elsewhere.
3. Optionally delete the `supabase/` migration.

**No change** to `shared/types/Asset.ts`, the entity registry, `assetRepo`, or any UI — that is the entire point of freezing the contract.

## Dependencies

- **Depends on**: account/channel language setup (alt-text locales).
- **Depended on by**: (future) Products (product images), CMS. Usage tracking ("Used in") is deferred post-v0 — data not available.

## Key Files

| Layer      | Path                                                                               |
| ---------- | ---------------------------------------------------------------------------------- |
| Types      | `shared/types/Asset.ts` (Asset + Folder)                                           |
| Registry   | `shared/utils/entities.ts` (`asset`, `folder`)                                     |
| Repository | `app/utils/repositories/asset.ts` (`assetApi`, `.folder` sub-repo)                 |
| Mock API   | `server/api/asset/**`, `server/utils/assets-mock.ts`                               |
| Migration  | `supabase/migrations/0001_assets_mock.sql`                                         |
| Pages      | `app/pages/asset-library/index.vue` (grid + list browse, folder nav, detail panel) |

## Decision Log

**2026-07: Supabase-backed mock, not a live API**
No Management API for assets exists yet. A Supabase mock behind Nitro routes lets the full frontend (types, registry, repos, UI) be built against a frozen contract and swapped later with no churn.

**2026-07: Folder as a backend category filter**
Folder filtering (self + descendants) resolves server-side rather than as client tree math, so the list page stays a plain filtered query and the behaviour survives the swap to the real API.

**2026-07: Slide-in detail panel as a new Studio convention**
Asset editing uses a slide-in panel (seeded from Buyer-on-Company), not a dedicated `[id].vue` route. Formalized as a reusable global primitive in Phase 2.
