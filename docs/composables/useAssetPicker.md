# `useAssetPicker`

`useAssetPicker` is the **imperative singleton service** for the asset picker. One [`AssetPickerPanel`](/components/asset/AssetPickerPanel) instance lives app-wide via [`AssetPickerHost`](/components/asset/AssetPickerHost) (mounted once in `app.vue`); every caller drives that one instance through shared module-level state.

Open the picker from anywhere — a button, a field, a table row action — and `await` the chosen assets:

```ts
const { open } = useAssetPicker();

async function pickImages() {
  const assets = await open({
    types: ['image'],
    preselectedIds: linkedIds.value,
  });
  if (assets.length) linkAssets(assets); // [] on cancel/close
}
```

:::tip Prefer the wrapper for simple triggers
For the common "wrap a button and get the result via `v-model`" case, use [`AssetPicker`](/components/asset/AssetPicker) — it calls this service for you. Reach for `useAssetPicker` directly when you need the promise (e.g. branching on the result, opening from non-template code).
:::

## Semantics

- **Cancel/close → `[]`.** `open()` never rejects, so callers need no `try/catch`. Guard on `assets.length` to skip the no-op case.
- **Re-entrant `open()` is ignored.** Calling `open()` while the picker is already open returns the same in-flight promise and leaves the current selection + options untouched (no re-target).
- **Single host.** State is module-level, so `useAssetPicker()` returns the same picker no matter where it's called.

## Return value

```ts
interface UseAssetPickerReturnType {
  isOpen: Readonly<Ref<boolean>>;
  options: DeepReadonly<Ref<AssetPickerOptions>>;
  open: (options?: AssetPickerOptions) => Promise<Asset[]>;
  confirm: (assets: Asset[]) => void;
  cancel: () => void;
}
```

### `open(options?)`

Opens the host panel with `options` and resolves with the selected `Asset[]` on confirm, or `[]` on cancel/close.

### `isOpen` / `options`

Read-only reactive state the host binds to the panel. Consumers rarely need these (the wrapper exposes `isOpen` as a slot prop).

### `confirm` / `cancel`

**Host-only.** [`AssetPickerHost`](/components/asset/AssetPickerHost) calls these to settle the pending promise (`confirm` with the picks, `cancel` with `[]`). Consumers never call them.

## `AssetPickerOptions`

Mirrors [`AssetPickerPanel`](/components/asset/AssetPickerPanel)'s props — see there for full semantics. Exported from `#shared/types`.

```ts
interface AssetPickerOptions {
  multiple?: boolean; // default true
  types?: AssetType[] | null; // default null (all types)
  preselectedIds?: string[]; // default []
  title?: string;
  folderId?: string | null; // default null (all assets)
}
```

## How it works

Module-level `isOpen` + `options` refs hold the panel state; a non-reactive `resolver` bridges `open()`'s promise to the host's `confirm`/`cancel`. Follows the app's singleton-composable pattern (state declared outside the function body — cf. [`usePanelStack`](/composables/usePanelStack)).

## Related

- [`AssetPicker`](/components/asset/AssetPicker) — declarative wrapper (default trigger + `v-model`)
- [`AssetPickerHost`](/components/asset/AssetPickerHost) — the single global panel instance
- [`AssetPickerPanel`](/components/asset/AssetPickerPanel) — the underlying panel UI
