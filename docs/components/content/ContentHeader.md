# `ContentHeader`

Page-level header bar that renders a title block, action area, optional tabs, and an unsaved-changes indicator. Hides itself when the table is in fullscreen/maximized mode.

## Features

- Collapses (`scale-y-0`) when the global `table-maximized` state is active
- Bottom padding removed when tabs or changes slot is present (they provide their own spacing)
- `title` slot allows a fully custom title block; defaults to [`ContentTitleBlock`](/components/content/ContentTitleBlock)
- `tabs` and `changes` slots are detected via `useSlots()` and rendered in a flex row

## Usage

### Basic Usage

```vue
<template>
  <ContentHeader title="Orders" description="Manage all customer orders" />
</template>
```

### With actions, tabs, and unsaved-changes indicator

```vue
<template>
  <ContentHeader title="Edit Order">
    <!-- default slot: right-side actions -->
    <ButtonIcon icon="Download" @click="exportOrder" />

    <template #tabs>
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="items">Items</TabsTrigger>
      </TabsList>
    </template>

    <template #changes>
      <UnsavedChangesIndicator />
    </template>
  </ContentHeader>
</template>
```

## Props

### `title`

```ts
title?: string
```

- **Type:** `string`
- **Default:** `''`
- **Description:** Page title passed to the default `ContentTitleBlock`. Unused when the `title` slot is provided.

### `description`

```ts
description?: string
```

- **Type:** `string`
- **Default:** `''`
- **Description:** Sub-title passed to the default `ContentTitleBlock`.

### `entityName`

```ts
entityName?: string
```

- **Type:** `string`
- **Default:** `''`
- **Description:** Reserved for future breadcrumb integration.

## Slots

### `title`

Override the entire title area with a custom element.

### default

Right-side content — typically action buttons rendered at the same height as the title.

### `tabs`

Tab navigation row; rendered in the lower bar when present.

### `changes`

Unsaved-changes indicator or save-state UI; rendered to the right of tabs.

## Dependencies

- [`ContentTitleBlock`](/components/content/ContentTitleBlock)
