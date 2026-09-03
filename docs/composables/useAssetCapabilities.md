# `useAssetCapabilities`

The `useAssetCapabilities` composable reports which Assets Library features are available for the configured backend. The shipped UI gates on it so controls the real **Geins.Media phase 1** API can't fulfil yet — metadata editing, delete, replace, tag autocomplete — disable cleanly instead of erroring, while the Supabase **mock** keeps everything on.

:::tip WHY
Studio built the full v0 UI against the mock. The real backend's phase 1 serves **browse + upload only**; the rest arrives in phase 2. Rather than delete that UI, we gate it — see the _Phase 8 — Real API alignment_ milestone.
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

| Field             | Type            | Gates                                                               |
| ----------------- | --------------- | ------------------------------------------------------------------- |
| `backend`         | `AssetsBackend` | The resolved backend (`mock` / `media-phase1`).                     |
| `canEditMetadata` | `boolean`       | Metadata form (name, description, alt text, tags, channels) + save. |
| `canMoveAsset`    | `boolean`       | Changing an asset's `folderId`.                                     |
| `canDeleteAsset`  | `boolean`       | Delete action (detail panel + card/row menu).                       |
| `canReplaceFile`  | `boolean`       | Replace-file action.                                                |
| `tagAutocomplete` | `boolean`       | Distinct-tags suggestions fetch.                                    |
| `hasThumbnails`   | `boolean`       | Backend produces real `thumbUrl`s (phase 1 returns null).           |

The mapping is a pure function — [`assetCapabilities(backend)`](/utils/asset) in `#shared/utils/asset` — so it is unit-tested and reusable outside a component.

## See also

- [`useAssetActions`](/composables/useAssetActions.md) — the copy / download / delete actions gated by `canDeleteAsset`.
- [`AssetDetailPanel`](/components/asset/AssetDetailPanel.md) — the primary consumer.
