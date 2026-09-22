# `useAssetCapabilities`

The `useAssetCapabilities` composable reports which Assets Library features the backend can serve. The shipped UI gates on it so controls **Geins.Media phase 1** can't fulfil yet — tags, channels, replace, tag autocomplete — disable cleanly instead of erroring.

:::tip WHY
Studio built the full v0 UI against a mock backend. Phase 1 of the real API serves **browse + upload, description/alt-text edit (`PATCH`), rename + move (`POST …/relocate`), delete (`DELETE` + restore) and usage links**; the rest arrives in phase 2. Rather than delete the UI that outran the backend, we gate it per field.
:::

## Usage

```ts
const caps = useAssetCapabilities();

// disable a control
<fieldset :disabled="!caps.canEditTags">…</fieldset>

// skip a fetch the backend can't answer
if (caps.tagAutocomplete) await refreshTags();
```

## Returns

An `AssetCapabilities` object (plain, not reactive — the surface is fixed per session):

| Field                       | Type      | Gates                                                     |
| --------------------------- | --------- | --------------------------------------------------------- |
| `canEditTags`               | `boolean` | Editing an asset's tags.                                  |
| `canEditChannels`           | `boolean` | Editing an asset's publication channels.                  |
| `canDeleteFolderWithAssets` | `boolean` | Choosing what happens to assets inside a deleted folder.  |
| `canReplaceFile`            | `boolean` | Replace-file action.                                      |
| `tagAutocomplete`           | `boolean` | Distinct-tags suggestions fetch.                          |
| `hasThumbnails`             | `boolean` | Backend produces real `thumbUrl`s (phase 1 returns `''`). |

Every flag is `false` today — each one names a phase-2 feature.

:::warning A FEATURE THE BACKEND SUPPORTS GETS NO FLAG
There is no `canEditDescriptionAltText`, `canDeleteAsset`, `hasTrash` or `hasUsageLinks` — all of those ship in phase 1, so they were removed rather than left permanently `true`. An always-`true` flag is dead gating: when phase 2 restores a feature, delete its flag **and** its consumers instead of flipping it (see the [cutover ledger](/domains/assets-cutover)).
:::

The mapping is a pure function — `assetCapabilities()` in `#shared/utils/asset` — so it is unit-tested and reusable outside a component.

## See also

- [`useAssetActions`](/composables/useAssetActions.md) — the copy / download / delete actions.
- [`AssetDetailPanel`](/components/asset/AssetDetailPanel.md) — the primary consumer.
