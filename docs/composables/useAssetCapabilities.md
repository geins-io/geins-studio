# `useAssetCapabilities`

The `useAssetCapabilities` composable reports which Assets Library features the backend can serve. The shipped UI gates on it so controls **Geins.Media** can't fulfil yet — tags + channels on the upload ticket, the folder-delete asset disposition — disable cleanly instead of erroring.

:::tip WHY
Studio built the full v0 UI against a mock backend. The real API serves **browse + upload, metadata edit incl. tags + channels (`PATCH`), tag suggestions (`GET media/tags`), rename + move (`POST …/relocate`), delete (`DELETE` + restore), replace and usage links**; the rest arrives later. Rather than delete the UI that outran the backend, we gate it per field.
:::

## Usage

```ts
const caps = useAssetCapabilities();

// disable a control
<fieldset :disabled="!caps.canUploadTagsAndChannels">…</fieldset>
```

## Returns

An `AssetCapabilities` object (plain, not reactive — the surface is fixed per session):

| Field                       | Type      | Gates                                                    |
| --------------------------- | --------- | -------------------------------------------------------- |
| `canUploadTagsAndChannels`  | `boolean` | Sending tags + channels on the upload ticket (wizard).   |
| `canDeleteFolderWithAssets` | `boolean` | Choosing what happens to assets inside a deleted folder. |

Every flag is `false` today — each one names a feature the backend doesn't serve yet.

:::warning A FEATURE THE BACKEND SUPPORTS GETS NO FLAG
There is no `canEditDescriptionAltText`, `canDeleteAsset`, `hasTrash`, `hasUsageLinks`, `canReplaceFile`, `hasThumbnails`, `canEditTags`, `canEditChannels` or `tagAutocomplete` — all of those ship (or, for thumbnails, were replaced by CDN scaling), so they were removed rather than left permanently `true`. An always-`true` flag is dead gating: when phase 2 restores a feature, delete its flag **and** its consumers instead of flipping it (see the [cutover ledger](/domains/assets-cutover)).
:::

The mapping is a pure function — `assetCapabilities()` in `#shared/utils/asset` — so it is unit-tested and reusable outside a component.

## See also

- [`useAssetActions`](/composables/useAssetActions.md) — the copy / download / delete actions.
- [`AssetWizardManage`](/components/asset/AssetWizardManage.md) — the primary consumer.
