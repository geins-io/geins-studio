# `SchemaEditorSheet`

`SchemaEditorSheet` is the sheet for editing the storefront-settings schema as raw JSON — opens with the current schema serialized into a [`JsonCodeEditor`](/components/channel/JsonCodeEditor), validates live, and applies the parsed schema back on confirm.

## Features

- Loads the schema as `JSON.stringify(schema, null, 2)` each time the sheet opens
- Live validation — parses on every keystroke, surfaces a [`Feedback`](/components/feedback/Feedback) banner with one of:
  - "Invalid JSON" — parse error
  - "Invalid schema" — parses but isn't a non-empty object
- Apply button is disabled while invalid
- Warning banner at the top about destructive consequences of editing the schema directly
- Lazy-loads the CodeMirror editor (`LazyChannelJsonCodeEditor`) — the editor bundle isn't pulled in until the sheet opens

## Usage

```vue
<script setup lang="ts">
const open = ref(false);
const schema = ref<StorefrontSchema>(currentSchema);

const onApply = (next: StorefrontSchema) => {
  schema.value = next;
};
</script>

<template>
  <ChannelSchemaEditorSheet
    :open="open"
    :schema="schema"
    @update:open="open = $event"
    @apply="onApply"
  />
</template>
```

## Props

### `open`

```ts
open: boolean
```

Sheet visibility.

### `schema`

```ts
schema: StorefrontSchema
```

The current schema — re-serialized into the editor each time the sheet opens.

## Events

### `update:open`

```ts
(value: boolean): void
```

### `apply`

```ts
(schema: StorefrontSchema): void
```

Emitted on Apply with the parsed schema.

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), `Button`
- [`Feedback`](/components/feedback/Feedback) — warning + invalid banners
- [`JsonCodeEditor`](/components/channel/JsonCodeEditor) (lazy)
