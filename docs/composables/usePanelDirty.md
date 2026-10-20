# `usePanelDirty`

`usePanelDirty` produces a robust dirty flag for slide-in panels — feed it to [`PanelEdit`](/components/panel/PanelEdit)'s `:dirty`. It's the panel counterpart to [`useUnsavedChanges`](/composables/useUnsavedChanges) (which is route-guard based, for full pages).

:::warning Why not `form.meta.value.dirty`?
vee-validate's `meta.dirty` **false-positives on open**: fields that start `undefined` in the reset values settle to `''` / `[]` / `false` on mount, and child inputs (reka `Combobox` / `TagsInput`, used by `FormInputChannels` / `FormInputTagsSearch`) emit a normalized value **after** mount. All of that flips `meta.dirty` with no user edit and trips the unsaved-changes guard on close.
:::

It compares a normalized JSON snapshot of the form values against a baseline captured **after the inputs settle** (`nextTick`), so only genuine edits read as dirty.

## Usage

```ts
const form = useForm({ validationSchema });
const { isDirty, captureBaseline } = usePanelDirty(() => form.values);

watch(open, (value) => {
  if (value) {
    form.resetForm({ values: /* entity → form values */ });
    captureBaseline(); // baseline settles on the next tick
  }
});
```

```vue
<PanelEdit v-model:open="open" :dirty="isDirty" @save="handleSave">…</PanelEdit>
```

## Parameters

### `values`

```ts
values: MaybeRefOrGetter<unknown>;
```

The values to track — pass a getter (`() => form.values`).

## Returns

### `isDirty`

```ts
isDirty: ComputedRef<boolean>;
```

`false` until `captureBaseline()` has run and a real change is made afterwards.

### `captureBaseline`

```ts
captureBaseline: () => void;
```

Re-baselines to the current values. Call on open, after `resetForm`; it waits a tick so child mount emits are folded into the baseline (dirty stays `false` meanwhile).

## Notes

- Object key order is normalized (never reads as a change); array order is significant (real data).
- Consumers: [`AssetDetailPanel`](/components/asset/AssetDetailPanel), `CompanyBuyerPanel`.
