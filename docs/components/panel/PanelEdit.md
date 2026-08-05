# `PanelEdit`

`PanelEdit` is the reusable slide-in edit panel — the standard shell for route-less entity editing (asset detail, company buyer, …). It wraps the shadcn [`Sheet`](/components/shadcn-vue) with a standard header / body / footer, an opt-in unsaved-changes guard, and panel-on-panel stacking.

## Features

- **Standard chrome** — title/description header, body slot, footer with save + cancel (overridable via the `#footer` slot).
- **Two variants** (`variant`): `sheet` (default) is a modal [`Sheet`](/components/shadcn-vue) for a top-level panel; `inline` is a plain `fixed` slide-over for a panel that STACKS on top of a `sheet` (see below).
- **Opt-in unsaved-changes guard** — pass `:dirty` (e.g. vee-validate `form.meta.value.dirty`, or a snapshot compare). While dirty, every close path (X, Esc, overlay, Cancel, backdrop) is intercepted and routed through [`DialogUnsavedChanges`](/components/dialog/DialogUnsavedChanges); confirming emits `discard` and closes. Dirty state stays in the consumer — no per-panel tracking.
- **Panel-on-panel** — a `sheet` stays `modal` the whole time and renders its stacked children (`inline` panels) inside its own content via the `#stack` slot, so they live in the modal subtree (Reka `hideOthers` / focus-trap stay correct) and the base is **never remounted**. While a child is open the base recedes (shift-left + dim) and goes `inert`; a click-catcher over the receded base closes the top panel (through the guard). Stacking membership is tracked by [`usePanelStack`](/composables/usePanelStack).

::: warning Why the base stays modal
Toggling the base `Sheet`'s `modal` prop makes Reka swap `DialogContentModal` ↔ `DialogContentNonModal` — a full remount of the base content that wipes child `FormField` values and resets `form.meta.dirty`. Keeping the base modal and rendering stacked panels inside it (rather than as separate modal Sheets) avoids that. The card `bg`/`shadow` sit on an inner wrapper, not on `SheetContent`, because a `transform`/`filter` on `SheetContent` would drag the `fixed` stacked child along with it.
:::

## Usage

```vue
<script setup lang="ts">
const open = ref(false);
const form = useForm({ validationSchema });
const isDirty = computed(() => form.meta.value.dirty);

const handleSave = async () => {
  /* validate + persist, then */ open.value = false;
};
</script>

<template>
  <PanelEdit
    v-model:open="open"
    :title="$t('edit_entity', { entityKey: 'asset' })"
    entity-key="asset"
    :dirty="isDirty"
    :loading="loading"
    :save-disabled="!form.meta.value.valid"
    @save="handleSave"
  >
    <template #trigger>
      <Button variant="outline">{{ $t('edit') }}</Button>
    </template>

    <!-- body: form fields -->
  </PanelEdit>
</template>
```

## Props

### `title`

```ts
title: string;
```

Header title (also the accessible description when `description` is omitted).

### `variant`

```ts
variant?: 'sheet' | 'inline';
```

- **Default:** `'sheet'`

`sheet` renders a modal [`Sheet`](/components/shadcn-vue) (top-level panel). `inline` renders a plain `fixed` slide-over with no Reka Dialog — for a panel that stacks over a `sheet`. Place an `inline` panel inside the base sheet's `#stack` slot so it lands in the base's modal subtree.

### `description`

```ts
description?: string;
```

Optional subtitle under the title.

### `width`

```ts
width?: 'narrow' | 'medium' | 'wide';
```

- **Default:** `'medium'`

Forwarded to `SheetContent`.

### `dirty`

```ts
dirty?: boolean;
```

- **Default:** `false`

When `true`, closing routes through the unsaved-changes dialog first.

### `loading`

```ts
loading?: boolean;
```

- **Default:** `false`

Save-button spinner; also blocks the unsaved guard mid-save.

### `saveDisabled`

```ts
saveDisabled?: boolean;
```

- **Default:** `false`

### `saveLabel` / `cancelLabel`

```ts
saveLabel?: string; // default $t('save')
cancelLabel?: string; // default $t('cancel')
```

### `hideFooter`

```ts
hideFooter?: boolean;
```

- **Default:** `false`

Hide the default footer (e.g. read-only or nothing to save).

### `entityKey`

```ts
entityKey?: string;
```

Forwarded to [`DialogUnsavedChanges`](/components/dialog/DialogUnsavedChanges).

## v-model

### `open`

```ts
v-model:open: boolean
```

Panel visibility.

## Events

### `save`

Emitted when the footer save button is clicked. The consumer validates + persists, then closes.

### `discard`

Emitted when the user confirms discarding unsaved changes.

## Slots

### default

Panel body (form fields, content).

### `trigger`

Optional element that opens the panel (rendered `as-child` in `SheetTrigger`). Omit when opening programmatically via `v-model:open`.

### `footer`

Overrides the default cancel/save footer.

### `stack`

Stacked (`inline`) child panels, rendered inside the base sheet's content so they share its modal subtree (only meaningful on a `sheet` variant). Example: [`AssetDetailPanel`](/components/asset/AssetDetailPanel) places [`PanelTranslation`](/components/panel/PanelTranslation) here.

```vue
<PanelEdit v-model:open="open" :title="title">
  <!-- body -->
  <template #stack>
    <PanelTranslation v-model:open="translationOpen" v-model="value" />
  </template>
</PanelEdit>
```

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), `Button`
- [`DialogUnsavedChanges`](/components/dialog/DialogUnsavedChanges) — the guard dialog
- [`usePanelStack`](/composables/usePanelStack) — stacking
