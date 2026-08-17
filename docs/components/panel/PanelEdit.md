# `PanelEdit`

`PanelEdit` is the reusable slide-in edit panel — the standard shell for route-less entity editing (asset detail, company buyer, …). It wraps the shadcn [`Sheet`](/components/shadcn-vue) with a standard header / body / footer, an opt-in unsaved-changes guard, and panel-on-panel stacking.

## Features

- **Standard chrome** — title/description header, body slot, footer with save + cancel (overridable via the `#footer` slot).
- **Automatic panel-on-panel**: the first panel opens as a modal [`Sheet`](/components/shadcn-vue); any panel opened while another is already open renders as a stacked slide-over and teleports into the bottom sheet (see below). No `variant` prop or manual wiring.
- **Opt-in unsaved-changes guard** — pass `:dirty` (e.g. vee-validate `form.meta.value.dirty`, or a snapshot compare). While dirty, every close path (X, Esc, overlay, Cancel, backdrop) is intercepted and routed through [`DialogUnsavedChanges`](/components/dialog/DialogUnsavedChanges); confirming emits `discard` and closes. Dirty state stays in the consumer — no per-panel tracking.
- **Panel-on-panel** — the bottom sheet stays `modal` the whole time and exposes a teleport container inside its content ([`usePanelStack`](/composables/usePanelStack) `registerTarget`). Stacked panels `<Teleport>` into it, so they live in the modal subtree (Reka `hideOthers` / focus-trap stay correct) and the base is **never remounted**. Which panels are open (and their order) is global stack state, so a stacked panel can be rendered anywhere — e.g. a translatable field deep in the base's body. While a panel is above, the one below recedes (shift-left + dim) and goes `inert`; a click-catcher over it closes the top panel (through the guard). Layers stack by index for N levels.

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

## Stacking

There is no slot or prop to wire — just render a second `PanelEdit`-based panel (e.g. [`PanelTranslation`](/components/panel/PanelTranslation)) anywhere and open it while the base is open. It detects the open base via [`usePanelStack`](/composables/usePanelStack), renders as a stacked slide-over, and teleports into the base sheet.

```vue
<PanelEdit v-model:open="open" :title="title"><!-- body --></PanelEdit>
<PanelTranslation v-model:open="translationOpen" v-model="value" />
```

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), `Button`
- [`DialogUnsavedChanges`](/components/dialog/DialogUnsavedChanges) — the guard dialog
- [`usePanelStack`](/composables/usePanelStack) — stacking
