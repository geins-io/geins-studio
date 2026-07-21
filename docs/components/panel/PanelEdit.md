# `PanelEdit`

`PanelEdit` is the reusable slide-in edit panel — the standard shell for route-less entity editing (asset detail, company buyer, …). It wraps the shadcn [`Sheet`](/components/shadcn-vue) with a standard header / body / footer, an opt-in unsaved-changes guard, and panel-on-panel stacking.

## Features

- **Standard chrome** — title/description header, body slot, footer with save + cancel (overridable via the `#footer` slot).
- **Opt-in unsaved-changes guard** — pass `:dirty` (e.g. vee-validate `form.meta.value.dirty`). While dirty, every close path (X, Esc, overlay, Cancel) is intercepted and routed through [`DialogUnsavedChanges`](/components/dialog/DialogUnsavedChanges); confirming emits `discard` and closes. Dirty state stays in the consumer's form — no per-panel tracking.
- **Panel-on-panel** — via [`usePanelStack`](/composables/usePanelStack): only the top panel is `modal` (one focus trap at a time; lower panels inert + receded).

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

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), `Button`
- [`DialogUnsavedChanges`](/components/dialog/DialogUnsavedChanges) — the guard dialog
- [`usePanelStack`](/composables/usePanelStack) — stacking
