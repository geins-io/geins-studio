# `ChannelSchemaEditorSheet`

`ChannelSchemaEditorSheet` is the sheet for editing the storefront-settings schema as raw JSON — opens with the current schema serialized into a [`JsonCodeEditor`](/components/JsonCodeEditor), validates live, and applies the parsed schema back on confirm.

## Features

- Loads the schema as `JSON.stringify(schema, null, 2)` each time the sheet opens
- Live validation — parses on every keystroke, surfaces a [`Feedback`](/components/Feedback) banner with one of:
  - "Invalid JSON" — parse error
  - "Invalid schema" — parses but isn't a non-empty object
- Apply button is disabled while invalid
- Apply opens [`ChannelSchemaApplyDialog`](/components/channel/ChannelSchemaApplyDialog) on top of the sheet. The edited schema is analyzed against the current `settings` so the dialog can show what will change. Cancelling the dialog returns to the editor with the JSON untouched
- Warning banner at the top about destructive consequences of editing the schema directly
- Lazy-loads the CodeMirror editor (`LazyJsonCodeEditor`) — the editor bundle isn't pulled in until the sheet opens

## Usage

```vue
<script setup lang="ts">
const open = ref(false);
const schema = ref<StorefrontSchema>(currentSchema);

const onApply = (next: StorefrontSchema, options: SchemaApplyOptions) => {
  schema.value = next;
  settings.value = applySchemaChange(
    schema.value,
    next,
    settings.value,
    options,
  );
};
</script>

<template>
  <ChannelSchemaEditorSheet
    :open="open"
    :schema="schema"
    :settings="settings"
    @update:open="open = $event"
    @apply="onApply"
  />
</template>
```

## Props

### `open`

```ts
open: boolean;
```

Sheet visibility.

### `schema`

```ts
schema: StorefrontSchema;
```

The current schema — re-serialized into the editor each time the sheet opens.

### `settings`

```ts
settings: StorefrontSettings;
```

The current settings values. Only read: the edited schema is compared with `schema` and these settings using `analyzeSchemaChange` before the apply dialog opens.

## Events

### `update:open`

```ts
(value: boolean): void
```

### `apply`

```ts
(schema: StorefrontSchema, options: SchemaApplyOptions): void
```

Emitted when the user confirms the apply dialog, with the parsed schema and the chosen `{ mode, removeOrphans }`. Pass the previous schema, the new one, the current settings and the options to `applySchemaChange` (`app/utils/storefront.ts`) to get the new settings. Nothing persists until the page is saved.

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), `Button`
- [`Feedback`](/components/Feedback) — warning + invalid banners
- [`ChannelSchemaApplyDialog`](/components/channel/ChannelSchemaApplyDialog)
- [`JsonCodeEditor`](/components/JsonCodeEditor) (lazy)
