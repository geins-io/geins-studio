# `StorefrontSettings`

`StorefrontSettings` is the **Storefront settings** card on a channel's edit page — schema-driven tabs, a Preview button, an action menu for changing or resetting the schema, and the destructive reset confirmation dialog. Each tab body is a [`StorefrontSchemaRenderer`](/components/channel/StorefrontSchemaRenderer).

## Features

- Schema-driven tabs: keys of `props.schema` become tab values; tab labels come from `schema[key].label`
- Falls back to the bundled `storefront-settings-default.json` schema when `props.schema` is empty (dev convenience)
- Keeps the active tab valid when the schema changes — re-pins to the first key if the current one disappears
- Header action area:
  - Preview button (with loading state) → emits `preview`
  - More-actions dropdown:
    - "Change schema" → emits `open-schema-editor` (parent opens [`SchemaEditorSheet`](/components/channel/SchemaEditorSheet))
    - "Reset schema" → opens an `AlertDialog` confirmation; confirm emits `reset-to-default`
- `disabled` blocks the preview button (used while another action is in flight)

## Usage

```vue
<template>
  <ChannelStorefrontSettings
    v-model="channel.settings"
    :schema="channel.settingsSchema"
    :resetting="resetting"
    :previewing="previewing"
    :disabled="anySaving"
    @open-schema-editor="schemaEditorOpen = true"
    @reset-to-default="resetToDefault"
    @preview="openPreview"
  />
</template>
```

> [!NOTE]
> Auto-imported as `ChannelStorefrontSettings`.

## Props

### `schema`

```ts
schema: StorefrontSchema
```

Drives the tab list. Empty / missing schema falls back to the bundled default.

### `modelValue`

```ts
modelValue: StorefrontSettings
```

The settings object — passed through every tab to [`SchemaField`](/components/channel/SchemaField).

### `resetting`

```ts
resetting?: boolean
```

Loading state on the destructive reset button.

### `previewing`

```ts
previewing?: boolean
```

Loading state on the Preview button.

### `disabled`

```ts
disabled?: boolean
```

Disables the Preview button.

## Events

### `update:modelValue`

```ts
(value: StorefrontSettings): void
```

### `open-schema-editor`

Emitted when the user picks "Change schema" — parent typically opens [`SchemaEditorSheet`](/components/channel/SchemaEditorSheet).

### `reset-to-default`

Emitted after the user confirms the destructive reset.

### `preview`

Emitted when the user clicks Preview.

## Dependencies

- [`ContentEditCard`](/components/content/edit/ContentEditCard)
- shadcn-vue [`Tabs`](/components/shadcn-vue), [`DropdownMenu`](/components/shadcn-vue), [`AlertDialog`](/components/shadcn-vue), `Button`
- [`StorefrontSchemaRenderer`](/components/channel/StorefrontSchemaRenderer)
- [`useGeinsLog`](/composables/useGeinsLog) — logs a fallback notice when the prop schema is empty
