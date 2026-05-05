# `StorefrontSchemaRenderer`

`StorefrontSchemaRenderer` renders a single tab of the storefront-settings schema — iterates the tab's sections, groups each section's fields into rows, and delegates each field to [`SchemaField`](/components/channel/SchemaField).

## Features

- Renders each section through [`ContentSection`](/components/content/ContentSection) (title + description + icon)
- Auto-rows each section's fields via the `groupFieldsIntoRows` utility — multi-column grids get the appropriate `gridClass`
- Tags the first sub-section per section with `isFirstSubSection` so [`SchemaField`](/components/channel/SchemaField) can suppress its top border

## Usage

This is mounted inside [`StorefrontSettings`](/components/channel/StorefrontSettings) — one renderer per tab. Direct usage is rare:

```vue
<template>
  <ChannelStorefrontSchemaRenderer
    :schema="schemaTab"
    :model-value="settings"
    @update:model-value="settings = $event"
  />
</template>
```

> [!NOTE]
> Auto-imported as `ChannelStorefrontSchemaRenderer` (the source lives at `app/components/channel/StorefrontSchemaRenderer.vue`).

## Props

### `schema`

```ts
schema: SchemaTab
```

A single tab descriptor with `sections` and per-section `fields`.

### `modelValue`

```ts
modelValue: StorefrontSettings
```

The full settings object — bubbled up to each [`SchemaField`](/components/channel/SchemaField) for read/write.

## Events

### `update:modelValue`

```ts
(value: StorefrontSettings): void
```

## Dependencies

- [`ContentSection`](/components/content/ContentSection)
- [`SchemaField`](/components/channel/SchemaField)
- `groupFieldsIntoRows`, `gridClass` utilities from `@/utils/storefront`
