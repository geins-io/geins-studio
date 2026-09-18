# `useAssetCapabilities`

The `useAssetCapabilities` composable reports which Assets Library features are available for the configured backend. The shipped UI gates on it so controls the real **Geins.Media phase 1** API can't fulfil yet — tags, channels, replace, tag autocomplete — disable cleanly instead of erroring, while the Supabase **mock** keeps everything on.

:::tip WHY
Studio built the full v0 UI against the mock. The real backend's phase 1 serves **browse + upload, plus description/alt-text edit (`PATCH`), rename + move (`POST …/relocate`) and delete (`DELETE` + restore)**; the rest arrives in phase 2. Rather than delete that UI, we gate it per field — see the _Phase 8 — Real API alignment_ milestone.
:::

## Configuration

The backend is a public runtime config value, `assetsBackend`, set from `NUXT_PUBLIC_ASSETS_BACKEND` (default `'mock'`):

| Value          | Meaning                                                |
| -------------- | ------------------------------------------------------ |
| `mock`         | Supabase mock — every feature on (default).            |
| `media-phase1` | Real Geins.Media phase 1 — gates the phase-2 features. |

## Usage

```ts
const caps = useAssetCapabilities();

// disable a control
<Button :disabled="!caps.canDeleteAsset">Delete</Button>

// skip a fetch the backend can't answer
if (caps.tagAutocomplete) await refreshTags();
```

## Returns

An `AssetCapabilities` object (plain, not reactive — the backend is fixed per session):

| Field                       | Type            | Gates                                                             |
| --------------------------- | --------------- | ----------------------------------------------------------------- |
| `backend`                   | `AssetsBackend` | The resolved backend (`mock` / `media-phase1`).                   |
| `canEditDescriptionAltText` | `boolean`       | Description + localized alt-text fields + save (phase-1 `PATCH`). |
| `canEditTags`               | `boolean`       | Editing an asset's tags.                                          |
| `canEditChannels`           | `boolean`       | Editing an asset's publication channels.                          |
| `canDeleteAsset`            | `boolean`       | Delete action (detail panel + card/row menu).                     |
| `canReplaceFile`            | `boolean`       | Replace-file action.                                              |
| `tagAutocomplete`           | `boolean`       | Distinct-tags suggestions fetch.                                  |
| `hasThumbnails`             | `boolean`       | Backend produces real `thumbUrl`s (phase 1 returns null).         |

:::warning A FEATURE BOTH BACKENDS SUPPORT GETS NO FLAG
There is no `canRenameAsset` / `canMoveAsset`: `POST /media/assets/{id}/relocate` ships in phase 1, so rename and move work everywhere and the fields were removed rather than left permanently `true`. An always-`true` flag is dead gating — retire each one as phase 2 restores its feature (see the [cutover ledger](/domains/assets-cutover)).
:::

The mapping is a pure function — [`assetCapabilities(backend)`](/utils/asset) in `#shared/utils/asset` — so it is unit-tested and reusable outside a component.

## See also

- [`useAssetActions`](/composables/useAssetActions.md) — the copy / download / delete actions gated by `canDeleteAsset`.
- [`AssetDetailPanel`](/components/asset/AssetDetailPanel.md) — the primary consumer.
