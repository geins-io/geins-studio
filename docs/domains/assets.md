# Assets Domain

> Media/asset library: grid + list browse, folder-scoped filtering, upload, and a slide-in detail/edit panel.
> For system architecture, see `ARCHITECTURE.md`. For app-level routing, see `APP.md`.

---

## Purpose

The Assets domain manages media files (images, SVGs, documents, PDFs, video, audio) and the folders that organise them. Assets carry metadata (name, description, localized alt text, tags, publication channels) and are referenced by other domains (product images, CMS). The UI is a workspace-level library at `/asset-library` with grid and list views and a slide-in editing panel.

**Status:** the library runs against the real **Geins.Media phase-1 API** through the catch-all proxy. The Supabase mock it was built against has been retired; what phase 1 does not serve yet (tags, channels, replace, thumbnails, tag autocomplete, folder-delete disposition) is gated off via [`useAssetCapabilities`](/composables/useAssetCapabilities) until phase 2.

## Key Concepts

**Folder = backend category filter** — Folders are an adjacency list (`parentFolderId`, self-referential). A folder is not client-side tree math: selecting one sends a `folderId` filter to the API, which returns that folder **plus all descendants**.

**Four rail scopes** — the rail's selection maps to list options via `assetListOptions` (`#shared/utils/asset`):

| Rail entry    | Selection         | List options       | Wire (`assetQuery`)   |
| ------------- | ----------------- | ------------------ | --------------------- |
| All assets    | `null`            | `undefined`        | no `folderIds`        |
| Uncategorised | `ROOT_FOLDER_KEY` | `folderId: null`   | `folderIds: [null]`   |
| A folder      | folder id         | `folderId: '<id>'` | `folderIds: ['<id>']` |
| Trash         | `TRASH_KEY`       | `trashed: true`    | `trashed: true`       |

**Uncategorised is a query, not a folder row** — assets with no folder are `folderId: null` on the real API, so the rail pins the entry itself. `folderId: null` and an omitted `folderId` must stay distinct all the way to the body; collapsing them turns the Uncategorised view into "everything". Geins.Media has no system folders at all; the old mock's `Archived` row is **gone for good** — its slot is now **Trash**, the real version of that idea.

**Asset types** (`AssetType`) — `image | svg | doc | pdf | video | audio | other`. Drives the type badge and thumbnail rendering.

**Localized fields** (`localizations`) — Translatable text follows the product-standard shape: `localizations: Localized<AssetLocalizations>` = `{ en: { description, altText }, sv: { description, altText } }` (locale → fields). Both **`description`** and **`altText`** are per-locale. The top-level `description` / `altText` on the returned `Asset` are the **default-language** values, **derived server-side** from `localizations` (single source of truth; the mapper reads `localizations[DEFAULT_LANG].*`, with `description` falling back to the legacy top-level column for pre-migration rows). Writes send `localizations` (a **full replace** — a missing locale/field is cleared, matching `assetLocalizationsRequest`); `description` is still accepted top-level on the **create** path (`AssetCreate`). The upload path carries the same `localizations` shape on its ticket claim (see **Upload** below), so the wizard's description + alt text are applied as the files land — no follow-up write. Available locales come from the **account/channel language setup**, feeding the global translation panel. (`LocalizedText` — a plain locale→string map — is the per-field shape the translation panel UI edits.)

**Channels** — String tags marking where an asset is published (web, mobile, …).

**Optimistic concurrency** (`etag` / `If-Match`) — Each `Asset` carries an opaque `etag`. The detail panel round-trips it as an `If-Match` header on `assetApi.update` (via `RepoFetchOptions.headers`), so a save against a version someone else already changed fails with **`412 Precondition Failed`** instead of silently overwriting. `412` is excluded from the global error toast (like `401`); the panel shows an inline "changed elsewhere — reload" alert and discards the stale copy on reload. Geins.Media owns the etag and enforces the precondition.

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

The contract is **camelCase + `_id`/`_type`** (via `ResponseEntity`), mirroring the rest of the Management API.

> **Wire fields.** `Asset._type` is `'geins.asset'`; each `Asset` carries `path` (= `folderPath`/`name`) and `folderPath` (owning folder's full path; `null` at root), and each `Folder` carries `path` + `depth` (segment count; 1 = top level). What remains temporary is logged in the [cutover ledger](./assets-cutover.md) (`grep cutover:`) so nothing rots when phase 2 lands.

| Method & path                      | Repo call                           | Body / query                              | Returns                  |
| ---------------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------ |
| `POST /asset/query`                | `assetApi.list(opts)`               | `assetQuery` (`all: true`, `folderIds[]`) | `Asset[]`                |
| `GET /asset/:id`                   | `assetApi.get(id)`                  | —                                         | `Asset`                  |
| `POST /asset`                      | `assetApi.create(data)`             | `AssetCreate`                             | `Asset`                  |
| `PATCH /asset/:id`                 | `assetApi.update(id, data)`         | `AssetUpdate`                             | `Asset`                  |
| `DELETE /asset/:id`                | `assetApi.delete(id)`               | —                                         | `null`                   |
| `POST /asset/:id/relocate`         | `assetApi.relocate(id, d)`          | `AssetRelocate` (rename / move)           | `Asset`                  |
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
- **Asset delete is soft.** `DELETE /media/assets/{id}` moves the asset to **trash**, recoverable via `POST /media/assets/{id}/restore`, with an **either-or** `trashed` filter on `assetQuery`: omitted (what we send) or `false` returns live assets only, `true` returns only trashed ones. Trashed assets are hard-deleted after a 30-day retention window (configurable, server-side). The asset drops out of the default library list, and `deleteAsset` refreshes `asset-library-list`. The copy is **neutral on permanence**: `asset_delete_confirm_description` overrides the shared `dialog.delete_confirm_description` ("permanently delete … cannot be undone") at both delete sites ([`AssetDetailPanel`](/components/asset/AssetDetailPanel) + the library page) via [`DialogDelete`](/components/dialog/DialogDelete)'s `description` prop.
- **Trash view.** The rail's **Trash** entry swaps the query for `trashed: true` — no folder scope, every trashed asset. It is hidden in the picker (`readonly`), which must never browse deleted assets. A trashed asset offers **Restore only**: [`AssetActionsMenu`](/components/asset/AssetActionsMenu) collapses to one item, the grid tile and the list's name stop opening [`AssetDetailPanel`](/components/asset/AssetDetailPanel), and the upload button is hidden — a trashed asset can't be edited, replaced or re-deleted, and its stored file may already be unreachable. Restore calls `assetApi.restore(id)` (`POST /media/assets/{id}/restore`) through `useAssetActions().restoreAsset`, which refreshes `asset-library-list`, so the row leaves trash on its own. The 30-day retention (`TRASH_RETENTION_DAYS`) is **stated, not enforced** — it renders under the toolbar and as the empty-state description, and nothing branches on it. There is no "delete permanently" / empty-trash action: the backend has no endpoint for it today.
- **Folder delete:** the caller picks what happens to the assets inside via `?assets`. `move` (default) re-homes them to uncategorised (`folder_id` FK is `ON DELETE SET NULL`); `delete` removes the whole folder + descendant subtree's assets first. Child folders cascade in both cases. The UI ([`AssetFolderDeleteDialog`](/components/asset/AssetFolderDeleteDialog)) only prompts for the choice when the subtree still holds assets; empty folders use the plain `DialogDelete` (`assetApi.folder.delete` — the move-only default).
  - **Empty-only**, gated on `useAssetCapabilities().canDeleteFolderWithAssets`: phase 1 has no disposition — `DELETE /media/folders/{id}` deletes an **empty** folder and answers `409 FOLDER_NOT_EMPTY` otherwise. With the capability off, [`AssetFolderTree`](/components/asset/AssetFolderTree) skips the subtree count probe and the choice dialog, calls `assetApi.folder.delete(id)` with `suppressErrorToast: true`, and renders the `409` (or any other failure) as the confirm dialog's warning callout instead of a toast. The richer dialog is kept in case phase 2 restores the disposition.
- **Upload (3-step ticket flow):** both the quick dialog and the wizard call `assetApi.uploadViaTickets(items)`, mirroring `Geins.Media`: **(1)** `POST /media/tickets` claims a ticket — each file's claim carries `name` / `folderId` / `sizeBytes` / `mimeType` / `overwrite` **plus the metadata applied on completion** (`description`, `altText`, `localizations`, `productIds`) and comes back `accepted` (with a per-file upload plan URL) or `rejected` (with a code). **(2)** each accepted file's bytes are `PUT` **straight to the plan URL** via raw `globalThis.fetch` (not `$geinsApi` — the plan URL is a storage endpoint, not the API proxy), with the Azure blob headers `x-ms-blob-type: BlockBlob` + `x-ms-blob-content-type` alongside `content-type`. **(3)** `POST /media/tickets/:id/complete` publishes the uploaded bytes as asset rows.
  - **Validate + chunk before claiming:** the repo enforces the ticket caps client-side (from `#shared/utils/asset`: ≤ `MAX_FILES_PER_TICKET` = 50 files, ≤ `MAX_TICKET_BYTES` = 10 GB per ticket, ≤ `MAX_FILE_BYTES` = 1 GB per file). A file over the per-file cap is rejected client-side (never claimed); the rest are packed into batches within the count + total caps, each batch its own ticket — so a large selection never trips the claim's `400`.
  - **Per-file outcomes:** `uploadViaTickets` returns merged `UploadCompleteResult[]` (completed + rejected, keyed by `clientRef`) — the ticket + complete stages are always HTTP 200 with per-file results, so a partial failure is not a request error. The UI maps each rejection **code** to friendly, translatable copy via `uploadRejectionMessageKey` (the wizard lists every rejection on its result screen; the quick dialog toasts a summary and shows reasons inline only when _nothing_ landed).
  - **Metadata rides the claim.** `media_request_uploadTicketFileRequest` carries `description` / `altText` / `localizations` / `productIds`, all applied when the ticket completes — so the **wizard** sends name + folder + localized description/alt text + the matched product on the claim itself and makes **no follow-up write**. That saves a request per file and closes the window where the bytes land but the metadata write fails (the old post-complete `PATCH /asset/:id` is gone). The wizard funnels description + alt text through **`localizations`** only — one shape, same as the detail panel's `PATCH` — leaving the top-level `description` / `altText` claim fields unused by the app. **Tags + channels** still have no phase-1 route and are disabled in the wizard's metadata step (values are held in wizard state — nothing is lost if a later phase enables them). The quick dialog uploads bare (files + folder, no metadata).
  - **Product links at upload:** with the wizard's "automatically link images to products" on, each matched file's claim carries `productIds: [product._id]` (already-resolved ids, max 100 per claim), so the link is persisted at create. Matching itself stays client-side (`useProductMatch`, `cutover: REVISIT@phase2`). Linking after the fact is `GET/POST /media/assets/{id}/links` — not wired up.
  - **Path mode (folder auto-creation):** omitting `folderId` from a claim puts it in path mode — `name` is then a path whose last segment is the file name, and the leading segments' folders are created as needed (`campaigns/hero.jpg` creates `campaigns`). `assetApi.uploadViaTickets` omits `folderId` only when the item omits it; an explicit `null` still means the library root. **No call site uses path mode today** — both the dialog and the wizard send an explicit folder.
- **Rename + move are one endpoint.** Real `POST /media/assets/{id}/relocate` takes `{ name, folderId }` as a **full replace** (like the folder `PUT`): a move sends the current `name`, a rename the current `folderId`; `folderId: null` is the library root, and `name` carries the extension and may not contain a slash (the panel's schema rejects one rather than taking the `422`). It answers **`200` or `202`** — a `202` means the move is accepted but not yet settled, so the caller refreshes `asset-library-list` and treats the list as the source of truth rather than the returned row. `409` is a name clash in the target folder.
  - **Save is two calls** in [`AssetDetailPanel`](/components/asset/AssetDetailPanel): `PATCH` (localizations + tags + channels) **first, carrying the `If-Match`**, then `relocate` when `name` or `folderId` changed. That order is deliberate — `relocate` has no precondition of its own, so putting the etag-checked write first means a concurrent change surfaces as a `412` **before** the move happens. `name` / `folderId` are deliberately absent from the `PATCH` body (they are not in the phase-1 update surface). A failed relocate is rendered as an inline `Alert` (the call passes `suppressErrorToast: true`), and the panel advances its held etag from the `PATCH` response so a retry isn't rejected as stale.
- **Replace:** `POST /media/assets/:id/replace` (multipart, single file) would upload a new file and repoint the existing row's file columns, keeping the same id, name, and metadata. **Phase 1 serves no such route** — `assetApi.replace` is kept for phase 2 and `canReplaceFile` gates every call site.

## Transport — the real Geins.Media surface

Assets and folders go through the catch-all proxy to the Geins Media API: `/media/assets`, `/media/folders`, `/media/tickets`. The first two come off the entity registry (`ENTITIES.asset` / `ENTITIES.folder`); tickets are a sibling constant in the repo.

The surface is not the Management API's conventions with a prefix swapped — verified against the shipped QA OpenAPI (`Geins Media API 1.0.0`):

- **`GET /media/folders`** lists folders at the collection root, not the Management API's `{base}/list`, so `assetApi.folder.list` overrides `entityRepo`'s default.
- **`PUT /media/folders/{id}`** replaces a folder (name + parent together) rather than patching it — hence the `folder.update` override and `FolderUpdate = CreateEntity<FolderBase>`: a move sends the current name, a rename sends the current `parentFolderId`.
- **`POST /media/tickets`** is a sibling of assets, not `…/assets/tickets`.
- **No `/tags` and no `/replace` route exists.** Both repo methods stay for phase 2 but are unreachable — `tagAutocomplete` / `canReplaceFile` gate every call site.
- **`POST /media/assets/{id}/relocate`** renames _and_ moves an asset; there is no `name`/`folderId` in the phase-1 `PATCH` surface.
- Real assets carry **no `tags` and no `channels` fields at all**, so both are optional on `AssetBase`. Every read site must tolerate `undefined` — a bare `asset.tags.length` in `AssetCard` blanked the entire grid when the first real assets landed (the render error tears down the subtree; the pagination footer outside it survives, which is what the symptom looks like).
- Folders follow `media_response_folder`: `path` (lowercased full path, **not** `fullPath`), `depth`, `createdBy`/`createdAt`/`updatedAt`. There is no manual ordering, so the folder tree sorts by name.
- `thumbUrl` comes back as `''`. `AssetThumbnail` / `TableCellAssetThumbnail` therefore preview the full-size `url` for `image`/`svg` assets (`assetPreviewUrl`), so the library shows pictures rather than a wall of type icons. Full-size files in grid tiles is the trade-off until Geins.Media serves thumbnails.
- **`GET /media/assets/{id}/links`** returns a **bare array** of `media_response_assetLink` — the asset usage behind the panel's "Where it's used" section.

### Usage links ("Where it's used")

A link is `{ assetId, targetType, targetId, createdBy?, createdAt }`. Three properties of the contract drive how [`AssetUsedIn`](/components/asset/AssetUsedIn) reads it:

- **No display name, and the server resolves nothing.** Only `targetId` comes back, so the client resolves it — `product` targets go through [`useProductMatch`](/composables/useProductMatch)'s `matchById` against the products store.
- **A link outlives its target.** A link to a since-deleted product is still returned. It won't resolve, so it renders as a plain `targetType · targetId` row rather than being dropped — the usage is real, and hiding it would under-report.
- **`targetType` is an open string.** Only `product` is writable, but the spec states values a release doesn't name are still returned, so it is typed as `string` (not an enum) and unknown types render.

A product `targetId` has its **leading zero stripped** when the link is written (`033126` → `33126`), which `matchById` compensates for with zero-stripped aliases in its index.

Writing links (`POST` / `DELETE .../links`) is not wired — Studio has no product edit page to drive it from. Note the response also carries `_type` with no `_id`; `AssetLink` deliberately omits it (`ResponseEntity` would add an `_id` the API never sends).

`x-account-key` needs **no** transport work: [`geins-api.ts`](app/plugins/geins-api.ts) sets it on every request from the session's account key, and the catch-all proxy forwards headers verbatim. The real API also accepts `x-functions-key` (Azure function app key) for direct function-host access — not used when calls go through the Geins gateway.

### What is left for phase 2

The capability gating in [`useAssetCapabilities`](/composables/useAssetCapabilities) is the only temporary machinery still standing. As each phase-2 feature lands, remove its flag **and** its consumers rather than flipping the flag to `true` — an always-true flag is dead gating. The [cutover ledger](./assets-cutover.md) tracks the remaining rows.

## Dependencies

- **Depends on**: account/channel language setup (alt-text locales).
- **Depended on by**: (future) Products (product images), CMS. Usage tracking ("Where it's used") reads `GET /media/assets/{id}/links` on the real backend — see below.

## Key Files

| Layer        | Path                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------- |
| Types        | `shared/types/Asset.ts` (Asset + Folder)                                                  |
| Registry     | `shared/utils/entities.ts` (`asset`, `folder`)                                            |
| Repository   | `app/utils/repositories/asset.ts` (`assetApi`, `.folder` sub-repo)                        |
| Capabilities | `app/composables/useAssetCapabilities.ts`, `assetCapabilities` in `shared/utils/asset.ts` |
| Pages        | `app/pages/asset-library/index.vue` (grid + list browse, folder nav, detail panel)        |
| Picker       | `app/composables/useAssetPicker.ts`, `app/components/asset/AssetPicker{,Host,Panel}.vue`  |

## Decision Log

**2026-07 → 2026-09: Supabase mock, then cutover**
No Management API served assets at the start, so a Supabase mock behind Nitro routes let the full frontend (types, registry, repos, UI) be built against a frozen contract. The swap landed in two steps: a reversible runtime switch (`NUXT_PUBLIC_ASSETS_BACKEND`) so the real API could be exercised with an instant fallback, then deletion of the mock once the phase-1 pass was signed off. The frozen contract held — the cutover was routes + gating, not a rewrite.

**2026-07: Folder as a backend category filter**
Folder filtering (self + descendants) resolves server-side rather than as client tree math, so the list page stays a plain filtered query and the behaviour survives the swap to the real API.

**2026-07: Slide-in detail panel as a new Studio convention**
Asset editing uses a slide-in panel (seeded from Buyer-on-Company), not a dedicated `[id].vue` route. Formalized as a reusable global primitive in Phase 2.
