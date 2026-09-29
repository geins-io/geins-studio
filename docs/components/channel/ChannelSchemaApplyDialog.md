# `ChannelSchemaApplyDialog`

`ChannelSchemaApplyDialog` is the confirm step between editing a storefront schema and applying it. It lets the user choose what happens to the channel's current storefront settings, and shows what will change before anything does. [`ChannelSchemaEditorSheet`](/components/channel/ChannelSchemaEditorSheet) opens it when Apply is clicked.

## Features

- Two option cards on the shadcn-vue `RadioGroup`:
  - **Apply only changes** (default, marked recommended): only what the edit changed is touched, so fields you didn't change keep whatever they hold. New fields get their schema default. In fields whose type or options changed, values that no longer fit (wrong type, or a select/radio value no longer among the options) get the default, or are removed when there is none. `null` counts as unset: it gets the default if there is one, is otherwise left alone, and is never listed as a reset.
  - **Apply and reset defaults**: replace every setting with the schema defaults. Styled as a warning, not as destructive, because it's the right choice for a new storefront setup, and the description says so. A warning `Feedback` explains that custom values are replaced.
- Under "Apply only changes":
  - a list of values that will be reset because they no longer fit
  - a count of new fields that will get their default
  - "No setting values are affected" when none of the above apply
  - when settings exist that no field covers ("orphans", including values of fields you just removed), a switch to remove them, and the keys and values listed under a "Settings not in schema" heading. The switch is off by default, because a storefront can read keys that were set straight through the API. While removal is on, rows are struck through and a warning `Feedback` says the storefront may stop working.
- Resets to "Apply only changes", with the switch off, every time it opens
- The description notes that nothing is saved until the channel is saved

## Usage

```vue
<script setup lang="ts">
const open = ref(false);
const analysis = ref(analyzeSchemaChange(schema, nextSchema, settings));

const onConfirm = (options: SchemaApplyOptions) => {
  settings.value = applySchemaChange(schema, nextSchema, settings, options);
};
</script>

<template>
  <ChannelSchemaApplyDialog
    v-model:open="open"
    :analysis="analysis"
    @confirm="onConfirm"
  />
</template>
```

## Props

### `open`

```ts
open: boolean; // v-model:open
```

### `analysis`

```ts
analysis: SchemaChangeAnalysis;
```

Result of `analyzeSchemaChange(previous, next, settings)` from `app/utils/storefront.ts`: `added` (new fields), `typeReset` (values that no longer fit a changed field) and `orphaned` entries (`{ key, value }`). A field counts as changed when its type, options or `boolean-choice` choice differ from `previous`. Keys are dot-notation paths. `orphaned` lists leaf values, and a field key covers its whole subtree (e.g. a `boolean-choice` object).

## Events

### `confirm`

```ts
(options: SchemaApplyOptions): void
```

`{ mode: 'changes' | 'reset', removeOrphans: boolean }`. `removeOrphans` is always `false` in reset mode, since reset drops everything that isn't a default anyway. The parent closes the dialog.

## Dependencies

- shadcn-vue `Dialog`, `RadioGroup`, `Switch`, `Badge`, `Item`, `Button`
- [`Feedback`](/components/Feedback) — reset warning
- `useLucideIcon()` — option icons
