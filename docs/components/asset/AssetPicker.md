# `AssetPicker`

`AssetPicker` is the **declarative wrapper** over [`useAssetPicker`](/composables/useAssetPicker): wrap any button / field / item to turn it into a picker trigger. Props mirror `AssetPickerOptions`; the chosen assets flow back through `v-model` and the `confirm` emit.

```vue
<AssetPicker v-model="images" :types="['image']">
  <Button>Add images</Button>
</AssetPicker>
```

A click on the wrapped child opens the shared [`AssetPickerHost`](/components/asset/AssetPickerHost); confirming updates `v-model` and emits `confirm`. Cancel/close leaves the model untouched.

## Trigger styles

Both work, and can be combined:

### Auto-bind (simplest)

Wrap a child and the wrapper catches the bubbled click:

```vue
<AssetPicker v-model="files" :types="fileTypes">
  <Button variant="outline">Attach files</Button>
</AssetPicker>
```

### Custom wiring (slot props)

The default slot exposes `{ open, isOpen }` for a custom handler:

```vue
<AssetPicker v-slot="{ open, isOpen }" :types="['image']" @confirm="onPicked">
  <Button :disabled="isOpen" @click="open">Choose a hero image</Button>
</AssetPicker>
```

Wiring `@click="open"` here is harmless alongside auto-bind — the wrapper also catches the bubbled click, but the second `open()` call is ignored while the picker is open.

## Props

Mirror [`AssetPickerOptions`](/composables/useAssetPicker#assetpickeroptions):

| Prop             | Type                  | Default | Notes                                               |
| ---------------- | --------------------- | ------- | --------------------------------------------------- |
| `multiple`       | `boolean`             | `true`  | Single vs multi-select.                             |
| `types`          | `AssetType[] \| null` | `null`  | Allowed types; `null` = all.                        |
| `preselectedIds` | `string[]`            | —       | Defaults to the current `v-model` ids when omitted. |
| `title`          | `string`              | —       | Panel heading override.                             |
| `folderId`       | `string \| null`      | `null`  | Initial folder scope.                               |

When `preselectedIds` is not given, the wrapper derives it from the current `v-model` — so re-opening shows the existing selection as "linked".

## v-model

```ts
defineModel<Asset[]>(); // default []
```

The selected assets. Set on confirm; **not** cleared on cancel.

## Events

### `confirm`

```ts
confirm: [assets: Asset[]];
```

Emitted on confirm with the chosen assets (same value written to `v-model`). Not emitted on cancel/close.

## Slot props

The default slot receives `{ open, isOpen }` — `open()` opens the picker, `isOpen` reflects the shared host's state.

## Related

- [`useAssetPicker`](/composables/useAssetPicker) — the imperative service this wraps
- [`AssetPickerHost`](/components/asset/AssetPickerHost) — the single global panel instance
- [`AssetPickerPanel`](/components/asset/AssetPickerPanel) — the underlying panel UI
