# `OrderFilesPanel`

A narrow side panel listing the files linked to one order (`orderfile` links), opened from the **Files** button on each row of a company's **Orders** tab. Each file opens, downloads or is unlinked here, and **Add files** links more. The customer who placed the order downloads these files through the Merchant API.

Not a [`PanelEdit`](/components/panel/PanelEdit.md): every action writes at once, so there is nothing unsaved. It's a plain `Sheet`, like [`AssetStoragePanel`](/components/asset/AssetStoragePanel.md).

## Data

- `assetApi.target('orderfile', orderId).list()` → `GET media/targets/orderfile/{orderId}/assets`: the order's live files as `LinkedAsset[]`, oldest link first. Trashed assets are left out. An order nothing links to answers `[]`.
- Read with `useAsyncData` under one stable key (`order-files`). A reactive per-order key wouldn't help: Nuxt seeds a new key's entry with the old key's data. So the panel tracks which order the cached files belong to (`loadedFor`) and shows the skeleton, with **Add files** disabled, until the opened order's files land. It reads again on every open, since files may have been linked from the library meanwhile.
- A `LinkedAsset` has no `url`, private or not, so every file opens through media's signed-URL routes.

## Rows

Type icon, name, size and link date, a **Private** badge for a private file, then three icon buttons with tooltips:

| Action   | What it does                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Open     | A new-tab link to `assetViewHref(id)` → `GET media/assets/{id}/view`, a 302 to a one-hour URL on the CDN host (signed if private). |
| Download | A same-origin link with `download` to `assetDownloadHref(id)` → `…/download`, a 302 to storage with `Content-Disposition`.         |
| Remove   | Confirms with [`DialogDelete`](/components/dialog/DialogDelete.md), then `assetApi.removeLink(id, 'orderfile', orderId)`.          |

The API proxy passes both 302s on to the browser instead of following them (`isMediaRedirectPath` in `shared/utils/proxy-headers.ts`), so the signed URL never reaches page JS and the bytes never pass through the function. They are top-level navigations, so the CSP needs no new host.

## Adding files

**Add files** opens the [asset picker](/composables/useAssetPicker.md) (multi-select, the linked files preselected as "Linked"). Its quick upload covers a file that isn't in the library yet. New picks are linked with `assetApi.bulkLink(ids, [orderLinkTarget(orderId)])`, 100 assets per call. Any asset can be linked, private ones included. Linking only adds, so a partial run is safe to repeat.

After an add or a remove, the panel refetches its list and `asset-links` (so an open asset detail panel shows the change). Toasts: `entity_added` (`file`) and `entity_removed` (`link`); failures go to the global API error toast.

## Usage

```vue
<OrderFilesPanel v-model:open="orderFilesOpen" :order-id="orderFilesId" />
```

## Props

| Prop      | Type             | Meaning                                  |
| --------- | ---------------- | ---------------------------------------- |
| `open`    | `boolean`        | `v-model:open`.                          |
| `orderId` | `string \| null` | The order's numeric id, the link target. |
