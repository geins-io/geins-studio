# `SchemaRenderer`

`SchemaRenderer` renders a single tab of a schema-driven form — iterates the tab's sections, groups each section's fields into rows, and delegates each field to [`SchemaFormField`](/components/SchemaFormField).

## Features

- Renders each section through [`ContentSection`](/components/content/ContentSection) (title + description + icon)
- Auto-rows each section's fields via the `groupFieldsIntoRows` utility — multi-column grids get the appropriate `gridClass`
- Tags the first sub-section per section with `isFirstSubSection` so [`SchemaFormField`](/components/SchemaFormField) can suppress its top border
- Wraps everything in `@container/schema` so multi-column grids collapse to one column on narrow containers (mirrors the [`FormGridWrap`](/components/form/FormGridWrap) pattern). Top-level grids collapse below `xl`; sub-section grids collapse below `2xl` — both driven by `gridClass(cols, sub)` in `@/utils/storefront`

## Usage

This is mounted inside [`ChannelStorefrontSettings`](/components/channel/ChannelStorefrontSettings) — one renderer per tab. Direct usage is rare:

```vue
<template>
  <SchemaRenderer
    :schema="schemaTab"
    :model-value="settings"
    @update:model-value="settings = $event"
  />
</template>
```

> [!NOTE]
> Auto-imported as `SchemaRenderer` (the source lives at `app/components/SchemaRenderer.vue`).

## Props

### `schema`

```ts
schema: SchemaTab;
```

A single tab descriptor with `sections` and per-section `fields`.

### `modelValue`

```ts
modelValue: StorefrontSettings;
```

The full settings object — bubbled up to each [`SchemaFormField`](/components/SchemaFormField) for read/write.

## Events

### `update:modelValue`

```ts
(value: StorefrontSettings): void
```

## Dependencies

- [`ContentSection`](/components/content/ContentSection)
- [`SchemaFormField`](/components/SchemaFormField)
- `groupFieldsIntoRows`, `gridClass` utilities from `@/utils/storefront`
