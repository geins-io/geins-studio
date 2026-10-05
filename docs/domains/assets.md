# Assets Domain

> Media/asset library: grid + list browse, folder-scoped filtering, upload, and a slide-in detail/edit panel.
> For system architecture, see `ARCHITECTURE.md`. For app-level routing, see `APP.md`.

---

## Purpose

The Assets domain manages media files (images, SVGs, documents, PDFs, video, audio) and the folders that organise them. Assets carry metadata (name, description, localized alt text, tags, publication channels) and are referenced by other domains (product images, CMS). The UI is a workspace-level library at `/asset-library` with grid and list views and a slide-in editing panel.

**Status:** the library runs against the real **Geins.Media phase-1 API** through the catch-all proxy. The Supabase mock it was built against has been retired; what phase 1 does not serve yet (tags, channels, replace, thumbnails, tag autocomplete, folder-delete disposition) is gated off via [`useAssetCapabilities`](/composables/useAssetCapabilities) until phase 2.

## Key Concepts

**Folder = backend category filter** — Folders are an adjacency list (`parentFolderId`, self-referential). A folder is not client-side tree math: selecting one sends a `folderIds` filter with `includeSubfolders: true`, so the API returns that folder **plus all descendants** (without the flag it returns only the folder's direct assets).

**Four rail scopes** — the rail's selection maps to list options via `assetListOptions` (`#shared/utils/asset`):

| Rail entry    | Selection         | List options       | Wire (`assetQuery`)                              |
| ------------- | ----------------- | ------------------ | ------------------------------------------------ |
| All assets    | `null`            | `undefined`        | `all: true`                                      |
| Uncategorised | `ROOT_FOLDER_KEY` | `folderId: null`   | `folderIds: [null]`                              |
| A folder      | folder id         | `folderId: '<id>'` | `folderIds: ['<id>']`, `includeSubfolders: true` |
| Trash         | `TRASH_KEY`       | `trashed: true`    | `trashed: true`                                  |

**Uncategorised is a query, not a folder row** — assets with no folder are `folderId: null` on the real API, so the rail pins the entry itself. `folderId: null` and an omitted `folderId` must stay distinct all the way to the body; collapsing them turns the Uncategorised view into "everything". Geins.Media has no system folders at all; the old mock's `Archived` row is **gone for good** — its slot is now **Trash**, the real version of that idea.

**Asset types** (`AssetType`) — `image | svg | doc | pdf | video | audio | other`. Drives the type badge and thumbnail rendering.

**Localized fields** (`localizations`) — Translatable text follows the product-standard shape: `localizations: Localized<AssetLocalizations>` = `{ en: { description, altText }, sv: { description, altText } }` (locale → fields). Both **`description`** and **`altText`** are per-locale. The top-level `description` / `altText` on the returned `Asset` are the **default-language** values, **derived server-side** from `localizations` (single source of truth; the mapper reads `localizations[DEFAULT_LANG].*`, with `description` falling back to the legacy top-level column for pre-migration rows). Writes send `localizations` (a **full replace** — a missing locale/field is cleared, matching `assetLocalizationsRequest`); `description` is still accepted top-level on the **create** path (`AssetCreate`). The upload path carries the same `localizations` shape on its ticket claim (see **Upload** below), so the wizard's description + alt text are applied as the files land — no follow-up write. Available locales come from the **account/channel language setup**, feeding the global translation panel. (`LocalizedText` — a plain locale→string map — is the per-field shape the translation panel UI edits.)

**Channels** — String tags marking where an asset is published (web, mobile, …).

**Optimistic concurrency** (`etag` / `If-Match`) — Each `Asset` carries an opaque `etag`. The detail panel round-trips it as an `If-Match` header on `assetApi.update` (via `RepoFetchOptions.headers`), so a save against a version someone else already changed fails with **`412 Precondition Failed`** instead of silently overwriting. `412` is excluded from the global error toast (like `401`); the panel shows an inline "changed elsewhere — reload" alert and discards the stale copy on reload. Geins.Media owns the etag and enforces the precondition.

**Browse state in the URL** — the library page reflects the folder, page, page size, sort, search and filters in the query (`?folder=<id>&page=<n>&perPage=<n>&sort=…&q=…&type=pdf,image&channels=…&modified=…`, defaults omitted) so a link opens the exact view. Grid and list share one [`useListQuery`](/composables/useListQuery). The grid uses [`PaginationBar`](/components/PaginationBar) (page-size + page nav, matching the table); the list view paginates via `TableView`.

**Library filters** — the toolbar carries the filter kit ([`ListFilterBar`](/components/list/filter/ListFilterBar) + [`ListFilterSheet`](/components/list/filter/ListFilterSheet)) right after the search input, so it applies to both views. Definitions come from [`useAssetListFilters`](/composables/useAssetListFilters): **Type** (`assetTypes`, pinned by default), **Channel** (`channels`, channel `_id`s) and **Modified** (`modifiedFrom` / `modifiedTo`; presets resolve at send time). Values within a filter OR, filters AND. They scope **trash** too and survive folder switches. Pins persist per user + route in a cookie (`useListFilters`). Search + filters together are the "active query": the empty state reads "no assets found" and its clear action resets both. Not offered yet: folder (the rail scopes it), used in (no backend filter), content languages, created by (the API takes one `createdBy` and has no creator list).

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

The picker is server-paged like the library page: one [`useListQuery`](/composables/useListQuery) (`key: 'asset-picker-list'`, fetched when the panel opens) over `assetApi.query`, scoped by the rail's folder (`deps`). `types` is a **fixed filter** (`assetTypes`) added in the fetcher: always sent, never shown as a user filter, and it doesn't count as an active query for the empty state. Search is the backend's word-prefix search. **Recently added** is every asset sorted `createdAt desc`, paged normally (the old client-side "top 12" cut is gone). The grid binds `PaginationBar` to the query; the list is a server-mode [`TableView`](/components/table/TableView). Selection is one `selectedIds` list for both views, resolved to assets through a map fed by every loaded page, so picks survive page and folder switches. A selected id that was never loaded (typically a preselected asset on another page) still counts as selected and is fetched with `assetApi.byIds` on confirm; if that fails the panel stays open rather than return a selection that would unlink it. Quick-upload ([`AssetUploadDialog`](/components/asset/AssetUploadDialog) `quick` method) is available inline — new assets matching the picker's types auto-select and the rail flips to "Recently added".

The [`AssetPickerPanel`](/components/asset/AssetPickerPanel) is not a `PanelEdit` (no unsaved-changes semantics) — it's a plain wide `Sheet` with a custom selection footer.

## Bulk actions

The library selects assets in bulk and runs one action over the selection.

- **One selection for both views.** The page keeps a single `selectedIds` list. The grid checks it through [`AssetCard`](/components/asset/AssetCard) (`selectable`, `select-on-click="false"`, so the tile still opens the detail panel) plus a "Select all on this page" checkbox. The list binds it to the server-mode [`TableView`](/components/table/TableView) via `v-model:selected-ids`.
- **What clears it.** Paging, view switches, sort, search and filters keep the selection; the bar counts the selection, not the rows on screen. A **folder change clears it**, because an action assumes one scope. Trash has no selection (no bulk restore exists, and bulk purge is not wired yet), so the bar never shows there.
- **Select all.** Once a whole page is selected and more match, the bar offers "Select all {N}", which loads every matching id with `assetApi.matchingIds` (same scope, search, filters and sort). In a folder that includes its subfolders, and the confirm step says so.
- **Bar and sheet.** [`ListBulkBar`](/components/list/bulk/ListBulkBar) shows the count, "Select all {N}", **Choose action** (opens [`ListBulkActionSheet`](/components/list/bulk/ListBulkActionSheet)), **Move to trash** (a shortcut straight to the confirm step) and **Deselect all**. Download comes with the zip issue.
- **Actions are config** (`BulkAction`, `#shared/types`): label, icon, an optional properties component bound with `v-model`, `isValid`, `summary`, `note`, `run` and `successMessage`. Every action goes through [`ListBulkActionConfirm`](/components/list/bulk/ListBulkActionConfirm).
- **Chunked runs.** [`useBulkRunner`](/composables/useBulkRunner) splits the ids into chunks of 100 (`chunkIds` / `runInChunks`, `#shared/utils/bulk`) and runs them one after another. Each call is all or nothing. A single chunk leaves errors to the global API error toast. Several chunks pass `suppressErrorToast` and end with one toast: success, or "X of N updated" with the failed ids **kept selected**. After a run the page refreshes `asset-library-list`.
- **Vocabulary.** Bulk trash uses the soft wording ("Move to trash", restorable for 30 days), never "delete". Only additive actions (tags, channels, links) say they can't be undone in bulk.

## API Contract

The contract is **camelCase + `_id`/`_type`** (via `ResponseEntity`), mirroring the rest of the Management API.

> **Wire fields.** `Asset._type` is `'geins.asset'`; each `Asset` carries `path` (= `folderPath`/`name`) and `folderPath` (owning folder's full path; `null` at root), and each `Folder` carries `path` + `depth` (segment count; 1 = top level). What remains temporary is logged in the [cutover ledger](./assets-cutover.md) (`grep cutover:`) so nothing rots when phase 2 lands.

| Method & path                      | Repo call                           | Body / query                                     | Returns                   |
| ---------------------------------- | ----------------------------------- | ------------------------------------------------ | ------------------------- |
| `POST /asset/query`                | `assetApi.list(opts)`               | `assetQuery` (`folderIds[]` / `trashed` / `all`) | `Asset[]`                 |
| `POST /asset/query`                | `assetApi.query(state, scope)`      | `assetQuery` (+ `search` / `sortBy` / filters)   | `BatchQueryResult<Asset>` |
| `GET /asset/:id`                   | `assetApi.get(id)`                  | —                                                | `Asset`                   |
| `POST /asset`                      | `assetApi.create(data)`             | `AssetCreate`                                    | `Asset`                   |
| `PATCH /asset/:id`                 | `assetApi.update(id, data)`         | `AssetUpdate`                                    | `Asset`                   |
| `DELETE /asset/:id`                | `assetApi.delete(id)`               | —                                                | `null`                    |
| `POST /asset/:id/relocate`         | `assetApi.relocate(id, d)`          | `AssetRelocate` (rename / move)                  | `Asset`                   |
| `POST /asset/tickets`              | `assetApi.uploadViaTickets(items)`  | `{ files: UploadTicketFile[] }`                  | `UploadTicketResponse`    |
| `PUT <plan url>` (bytes)           | ↳ raw `fetch` (no proxy)            | file bytes + Azure blob headers                  | `—`                       |
| `POST /asset/tickets/:id/complete` | ↳ same method                       | `{ files: clientRef[] }`                         | `UploadCompleteResponse`  |
| `POST /asset/:id/replace`          | `assetApi.replace(id, file)`        | `AssetReplace` → then ticket PUT + complete      | `UploadCompleteResult`    |
| `GET /asset/folder/list`           | `assetApi.folder.list()`            | —                                                | `Folder[]`                |
| `GET /asset/folder/:id`            | `assetApi.folder.get(id)`           | —                                                | `Folder`                  |
| `POST /asset/folder`               | `assetApi.folder.create(d)`         | `FolderCreate`                                   | `Folder`                  |
| `PATCH /asset/folder/:id`          | `assetApi.folder.update(…)`         | `FolderUpdate` (rename / move)                   | `Folder`                  |
| `DELETE /asset/folder/:id`         | `assetApi.deleteFolder(id, assets)` | `?assets=move\|delete` (default `move`)          | `null`                    |

- **Library browse is server-paged.** The library page (`app/pages/asset-library/index.vue`) runs one [`useListQuery`](/composables/useListQuery) (`key: 'asset-library-list'`) over `assetApi.query`, with the folder rail selection as scope (`deps`). It drives both views, so the grid and the list share page, page size (24 / 48 / 96), sort and search. The list is a [`TableView`](/components/table/TableView) with `data-source="server"`; the grid renders `items` with a `PaginationBar` and has no sort control of its own. Sortable column ids are the query's `sortBy`: `name`, `type`, `folderPath`, `sizeBytes`, `updatedAt` (the folder column shows the folder name but sorts by path; tags don't sort). **Search is the backend's**: it matches the start of a word across name, folder path, description, alt text and creator, not any substring of the name. `?folder`, `?page`, `?perPage`, `?sort` and `?q` are in the URL. `?folder` is read from the route through a computed setter, so it can't race `useListQuery`'s own URL write. Mutations refresh `asset-library-list` by key, which keeps the page, sort and search and drops the batch.
- **List query (fetch-all):** `assetApi.list()` POSTs the real `assetQuery` shape to `POST /asset/query` and unwraps `BatchQueryResult.items`. It requests a single `page: 1, pageSize: 1000` (the real schema's cap; default 100) and treats that as the whole set. Its one remaining caller is the subtree asset count in [`AssetFolderTree`](/components/asset/AssetFolderTree)'s folder-delete probe, which stays fetch-all. **`all: true` is only sent for the unfiltered "all assets" view**: it matches every asset _regardless of_ the other filters, so pairing it with `folderIds` / `trashed` silently drops the scope. Still guard with `Array.isArray()` before `.map()` (per the repository rules in `CLAUDE.md`).
- **Server-driven query:** `assetApi.query(state, scope, { batchId, signal })` is the paged adapter for server-driven lists. It maps a `ListQueryState<AssetQueryFilters>` onto `assetQuery`, with `search`, `sortBy`/`sortDirection` (column ids map one-to-one; unknown ones are dropped), filters, `page`, `pageSize` (clamped to 1000) and the batch `_id`. It returns the full `BatchQueryResult`. Scope is `assetListOptions(selected)`, the same as `list()`. See [List queries](../concepts/list-queries.md). `list()` stays the fetch-all path for its remaining caller (above).
- **Matching ids:** `assetApi.matchingIds(state, scope)` pages `POST /media/assets/query` at the 1000 cap (same batch `_id`) until `pageCount`, and returns every id the list's query matches. It backs the library's bulk "Select all {N}". Uncapped: 10 000 assets is 10 reads.
- **Bulk move to trash:** `assetApi.bulkDelete(ids)` → `POST /media/assets/bulk-delete { assetIds }` (`204`). At most 100 ids, no duplicates, all or nothing per call (a `404` "Assets not found." lists the refused ids in `detail`). Already-trashed ids are left alone. There is no bulk restore.
- **By id:** `assetApi.byIds(ids)` sends `assetIds` on `POST /media/assets/query` (one page, sized to the ids) and returns the live matches; trashed or deleted ids are simply absent. The picker uses it to resolve selected assets it never loaded.
- **`folderIds` filtering** goes over the wire as `folderIds: [id]` + `includeSubfolders: true` (the selected folder + descendants). The library root is `folderIds: [null]` **without** `includeSubfolders` — Uncategorised is root-level assets only, and "descendants of root" would be the whole library. Omitted entirely for the "all assets" view.
- **Asset delete is soft.** `DELETE /media/assets/{id}` moves the asset to **trash**, recoverable via `POST /media/assets/{id}/restore`, with an **either-or** `trashed` filter on `assetQuery`: omitted (what we send) or `false` returns live assets only, `true` returns only trashed ones. Trashed assets are hard-deleted after a 30-day retention window (configurable, server-side). The asset drops out of the default library list, and `deleteAsset` refreshes `asset-library-list`. The copy is **neutral on permanence**: `asset_delete_confirm_description` overrides the shared `dialog.delete_confirm_description` ("permanently delete … cannot be undone") at both delete sites ([`AssetDetailPanel`](/components/asset/AssetDetailPanel) + the library page) via [`DialogDelete`](/components/dialog/DialogDelete)'s `description` prop.
- **Trash view.** The rail's **Trash** entry swaps the query for `trashed: true` — no folder scope, every trashed asset. It is hidden in the picker (`readonly`), which must never browse deleted assets. A trashed asset offers **Restore only**: [`AssetActionsMenu`](/components/asset/AssetActionsMenu) collapses to one item, the grid tile and the list's name stop opening [`AssetDetailPanel`](/components/asset/AssetDetailPanel), and the upload button is hidden — a trashed asset can't be edited, replaced or re-deleted, and its stored file may already be unreachable. Restore calls `assetApi.restore(id)` (`POST /media/assets/{id}/restore`) through `useAssetActions().restoreAsset`, which refreshes `asset-library-list`, so the row leaves trash on its own. **Trash columns + sort:** in trash the list swaps "Modified" for **Moved to trash** (`deletedAt`, a date) and **Deleted permanently** (`purgeAfter`, relative: "in 12 days" via `useDate().formatRelativeDate`); both sort. The grid card's meta shows "Moved to trash {date}". `purgeAfter` is fixed at trash time, so a later retention change doesn't move it. Trash defaults to `deletedAt desc` (most recently trashed first). The `?folder` setter writes `?sort=-deletedAt` in the same navigation on entering trash, and drops `?sort` on leaving, because a separate sort write would race `useListQuery`'s URL reader. A link into trash without a sort gets the trash default, and a live link carrying a trash-only sort (`deletedAt` / `purgeAfter`) drops it. The 30-day retention (`TRASH_RETENTION_DAYS`) is **stated, not enforced** — it renders under the toolbar and as the empty-state description, and nothing branches on it. There is no "delete permanently" / empty-trash action: the backend has no endpoint for it today.
- **Folder delete:** the caller picks what happens to the assets inside via `?assets`. `move` (default) re-homes them to uncategorised (`folder_id` FK is `ON DELETE SET NULL`); `delete` removes the whole folder + descendant subtree's assets first. Child folders cascade in both cases. The UI ([`AssetFolderDeleteDialog`](/components/asset/AssetFolderDeleteDialog)) only prompts for the choice when the subtree still holds assets; empty folders use the plain `DialogDelete` (`assetApi.folder.delete` — the move-only default).
  - **Empty-only**, gated on `useAssetCapabilities().canDeleteFolderWithAssets`: phase 1 has no disposition — `DELETE /media/folders/{id}` deletes an **empty** folder and answers `409 FOLDER_NOT_EMPTY` otherwise. With the capability off, [`AssetFolderTree`](/components/asset/AssetFolderTree) skips the subtree count probe and the choice dialog, calls `assetApi.folder.delete(id)` with `suppressErrorToast: true`, and renders the `409` (or any other failure) as the confirm dialog's warning callout instead of a toast. The richer dialog is kept in case phase 2 restores the disposition.
- **Upload (3-step ticket flow):** both the quick dialog and the wizard call `assetApi.uploadViaTickets(items)`, mirroring `Geins.Media`: **(1)** `POST /media/tickets` claims a ticket — each file's claim carries `name` / `folderId` / `sizeBytes` / `mimeType` / `overwrite` **plus the metadata applied on completion** (`description`, `altText`, `localizations`, `links`) and comes back `accepted` (with a per-file upload plan URL) or `rejected` (with a code). **(2)** each accepted file's bytes are `PUT` **straight to the plan URL** via raw `globalThis.fetch` (not `$geinsApi` — the plan URL is a storage endpoint, not the API proxy), with the Azure blob headers `x-ms-blob-type: BlockBlob` + `x-ms-blob-content-type` alongside `content-type`. **(3)** `POST /media/tickets/:id/complete` publishes the uploaded bytes as asset rows.
  - **Validate + chunk before claiming:** the repo enforces the ticket caps client-side (from `#shared/utils/asset`: ≤ `MAX_FILES_PER_TICKET` = 50 files, ≤ `MAX_TICKET_BYTES` = 10 GB per ticket, ≤ `MAX_FILE_BYTES` = 1 GB per file). A file over the per-file cap is rejected client-side (never claimed); the rest are packed into batches within the count + total caps, each batch its own ticket — so a large selection never trips the claim's `400`.
  - **Per-file outcomes:** `uploadViaTickets` returns merged `UploadCompleteResult[]` (completed + rejected, keyed by `clientRef`) — the ticket + complete stages are always HTTP 200 with per-file results, so a partial failure is not a request error. The UI maps each rejection **code** to friendly, translatable copy via `uploadRejectionMessageKey` (the wizard lists every rejection on its result screen; the quick dialog toasts a summary and shows reasons inline only when _nothing_ landed).
  - **Metadata rides the claim.** `media_request_uploadTicketFileRequest` carries `description` / `altText` / `localizations` / `links`, all applied when the ticket completes — so the **wizard** sends name + folder + localized description/alt text + the matched product on the claim itself and makes **no follow-up write**. That saves a request per file and closes the window where the bytes land but the metadata write fails (the old post-complete `PATCH /asset/:id` is gone). The wizard funnels description + alt text through **`localizations`** only — one shape, same as the detail panel's `PATCH` — leaving the top-level `description` / `altText` claim fields unused by the app. **Tags + channels** still have no phase-1 route and are disabled in the wizard's metadata step (values are held in wizard state — nothing is lost if a later phase enables them). The quick dialog uploads bare (files + folder, no metadata).
  - **Product links at upload:** with the wizard's "automatically link assets to products" on, each matched file's claim carries `links: [{ targetType, targetId: product._id }]` (max 100 per claim, same shape as the link endpoint), so the link is persisted at create. `targetType` comes from the file's resolved `AssetType` via `productLinkTargetType`: `productimage` for image/svg, `productfile` for everything else — a `productimage` link on a non-image is rejected at complete with `LINK_ASSET_TYPE_INVALID`. The deprecated `productIds` claim field is not sent. Matching itself stays client-side (`useProductMatch`, `cutover: REVISIT@phase2`). Linking after the fact is `POST /media/assets/{id}/links` — not wired up.
  - **Content sniffing:** `FILE_TYPE_NOT_ALLOWED` also fires when the bytes contradict the extension (PNG bytes named `report.txt`), on uploads and replacements, so its copy covers both causes.
  - **Path mode (folder auto-creation):** omitting `folderId` from a claim puts it in path mode — `name` is then a path whose last segment is the file name, and the leading segments' folders are created as needed (`campaigns/hero.jpg` creates `campaigns`). `assetApi.uploadViaTickets` omits `folderId` only when the item omits it; an explicit `null` still means the library root. **No call site uses path mode today** — both the dialog and the wizard send an explicit folder.
- **Rename + move are one endpoint.** Real `POST /media/assets/{id}/relocate` takes `{ name, folderId }` as a **full replace** (like the folder `PUT`): a move sends the current `name`, a rename the current `folderId`; `folderId: null` is the library root, and `name` carries the extension and may not contain a slash (the panel's schema rejects one rather than taking the `422`). It answers **`200` or `202`** — a `202` means the move is accepted but not yet settled, so the caller refreshes `asset-library-list` and treats the list as the source of truth rather than the returned row. `409` is a name clash in the target folder.
  - **Save is two calls** in [`AssetDetailPanel`](/components/asset/AssetDetailPanel): `PATCH` (localizations + tags + channels) **first, carrying the `If-Match`**, then `relocate` when `name` or `folderId` changed. That order is deliberate — `relocate` has no precondition of its own, so putting the etag-checked write first means a concurrent change surfaces as a `412` **before** the move happens. `name` / `folderId` are deliberately absent from the `PATCH` body (they are not in the phase-1 update surface). A failed relocate is rendered as an inline `Alert` (the call passes `suppressErrorToast: true`), and the panel advances its held etag from the `PATCH` response so a retry isn't rejected as stale.
- **Replace (in place, on the ticket flow):** `POST /media/assets/:id/replace` takes JSON `AssetReplace` (`{ fileName, sizeBytes, mimeType? }`) and returns an `UploadTicketResponse` with one accepted result whose `clientRef` and `assetId` are the asset's id. From there it is the upload pipeline — `assetApi.replace(id, file)` shares the PUT-bytes + `complete` step with `uploadViaTickets` (one internal helper, not a second pipeline) and returns the single `UploadCompleteResult`.
  - **Extension rule:** the path, and so the extension, never changes. The new file must carry the asset's extension or an alias for the same type (`.jpg` ↔ `.jpeg`, `.tif` ↔ `.tiff`, `.htm` ↔ `.html` — `replaceExtensions` / `isReplaceExtensionAllowed` in `#shared/utils/asset`). [`AssetReplaceDialog`](/components/asset/AssetReplaceDialog) restricts the file input's `accept` and refuses a mismatched drop inline; the backend still answers `422` for anything that slips through. To change type, relocate first (which changes the URL).
  - **Errors:** the claim throws `404` (trashed / unknown asset), `409` (`ASSET_MOVE_IN_FLIGHT` / `PATH_MOVE_PENDING` while a move runs) or `422` (extension / name) — mapped by `replaceErrorMessageKey`. A completion rejection comes back as the `rejected` result and maps through `uploadRejectionMessageKey` like an upload. A rejected replacement restores the previous file, so the dialog's error copy always says the original was kept. The dialog shows these inline (`suppressErrorToast: true`).
  - **Usage warning:** the dialog counts the asset's `GET …/links` (both product kinds and any other target) in its "used everywhere" warning. The count is a floor — use by URL isn't linked, and a link can outlive its target — so a pending, failed or empty read falls back to the static line.
  - **After success:** `url` (its `v` cache-buster), `etag`, size, MIME, type and blob version change; name, texts, tags, channels and links stay. The dialog refetches the asset (`assetApi.get`) and `asset-library-list`, and the detail panel advances its held etag from the refetched row so the next `PATCH` doesn't fail its `If-Match` with a `412`.

## Transport — the real Geins.Media surface

Assets and folders go through the catch-all proxy to the Geins Media API: `/media/assets`, `/media/folders`, `/media/tickets`. The first two come off the entity registry (`ENTITIES.asset` / `ENTITIES.folder`); tickets are a sibling constant in the repo.

The surface is not the Management API's conventions with a prefix swapped — verified against the shipped QA OpenAPI (`Geins Media API 1.0.0`):

- **`GET /media/folders`** lists folders at the collection root, not the Management API's `{base}/list`, so `assetApi.folder.list` overrides `entityRepo`'s default.
- **`PUT /media/folders/{id}`** replaces a folder (name + parent together) rather than patching it — hence the `folder.update` override and `FolderUpdate = CreateEntity<FolderBase>`: a move sends the current name, a rename sends the current `parentFolderId`.
- **`POST /media/tickets`** is a sibling of assets, not `…/assets/tickets`.
- **No `/tags` route exists.** `assetApi.listTags` stays for phase 2 but is unreachable — `tagAutocomplete` gates every call site.
- **`POST /media/assets/{id}/relocate`** renames _and_ moves an asset; there is no `name`/`folderId` in the phase-1 `PATCH` surface.
- Real assets carry **no `tags` and no `channels` fields at all**, so both are optional on `AssetBase`. Every read site must tolerate `undefined` — a bare `asset.tags.length` in `AssetCard` blanked the entire grid when the first real assets landed (the render error tears down the subtree; the pagination footer outside it survives, which is what the symptom looks like).
- Folders follow `media_response_folder`: `path` (lowercased full path, **not** `fullPath`), `depth`, `createdBy`/`createdAt`/`updatedAt`. There is no manual ordering, so the folder tree sorts by name.
- **No backend thumbnails.** Assets carry only `url` (CDN host `cdn-qa.geins.media/{account}/{path}`, with a `?v=` cache-buster). Previews are scaled by Fastly's image optimizer through query params: `assetPreviewUrl(type, url, preset)` appends one of the fixed `ASSET_PREVIEW_PRESETS` (`row` 40×40, `card` 420×280, `banner` 500×250 — all `fit=crop&dpr=2`) to `image` URLs. SVGs are served unchanged by the optimizer, so they get the raw `url`; non-image types show the type icon. Each distinct query string is a separately cached + billed variant — keep the preset set small.
- **`GET /media/assets/{id}/links`** returns a **bare array** of `media_response_assetLink` — the asset usage behind the panel's "Where it's used" section.

### Usage links ("Where it's used")

A link is `{ assetId, targetType, targetId, createdBy?, createdAt }`. Three properties of the contract drive how [`AssetUsedIn`](/components/asset/AssetUsedIn) reads it:

- **No display name, and the server resolves nothing.** Only `targetId` comes back, so the client resolves it — product targets go through [`useProductMatch`](/composables/useProductMatch)'s `matchById` against the products store.
- **A link outlives its target.** A link to a since-deleted product is still returned. It won't resolve, so it renders as a plain `targetType · targetId` row rather than being dropped — the usage is real, and hiding it would under-report.
- **Product links come in two kinds.** `productimage` (image + svg only — anything else is a `422`) and `productfile` (any type), typed as `AssetLinkTargetType`. The old single `product` kind is gone from reads (existing links were migrated by asset type). Both kinds resolve the same way; the row carries an **Image** / **File** badge.
- **`targetType` is read as an open string.** The spec states values a release doesn't name are still returned, so `AssetLink.targetType` is `AssetLinkTargetType | (string & {})` and unknown types render.
- **A trashed asset's links answer `404`** (`GET`/`POST`/`DELETE`). The panel never opens for a trashed asset; `AssetUsedIn` still maps a `404` to "no usage".

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
