# `ContentCardHeader`

A structured header block with an optional icon/image, title, and description. Used at the top of `ContentCard` sections and inside `ContentSection`.

## Features

- Three sizes: `lg` (default), `md`, `sm` — adjusts font sizes responsively
- Configurable heading level (`h1`–`h6`) for correct document outline
- Optional icon rendered via `useLucideIcon()` (any PascalCase Lucide icon name)
- Optional slot override for the icon area (`#icon`)
- Supports `mediaVariant` to swap between icon and image styling

## Usage

### Basic Usage

```vue
<template>
  <ContentCardHeader
    title="Shipping Address"
    description="Where this order will be delivered"
  />
</template>
```

### With a Lucide icon

```vue
<template>
  <ContentCardHeader
    title="Billing"
    description="Invoice details"
    icon="CreditCard"
    size="md"
  />
</template>
```

### With a custom icon slot

```vue
<template>
  <ContentCardHeader title="Custom Icon">
    <template #icon>
      <img src="/logo.svg" class="size-5" alt="" />
    </template>
  </ContentCardHeader>
</template>
```

## Props

### `title`

```ts
title: string
```

- **Type:** `string`
- **Required:** yes
- **Description:** Primary heading text.

### `description`

```ts
description?: string
```

- **Type:** `string`
- **Description:** Secondary descriptive text rendered below the title.

### `icon`

```ts
icon?: string
```

- **Type:** `string`
- **Description:** PascalCase Lucide icon name (e.g. `'Package'`, `'CreditCard'`). Resolved by `useLucideIcon`.

### `mediaVariant`

```ts
mediaVariant?: 'icon' | 'image'
```

- **Type:** `'icon' | 'image'`
- **Default:** `'icon'`
- **Description:** Controls the styling of the media container.

### `size`

```ts
size?: 'lg' | 'md' | 'sm'
```

- **Type:** `'lg' | 'md' | 'sm'`
- **Default:** `'lg'`
- **Description:** Scales title and description font sizes. Use `md` for sub-section headers and `sm` for compact nested headers.

### `headingLevel`

```ts
headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
```

- **Type:** heading level tag
- **Default:** `'h2'`
- **Description:** The HTML element rendered for the title. Adjust for correct document heading hierarchy.

## Slots

### `icon`

Override the default icon with arbitrary content. Rendered inside the `ItemMedia` container.

## Dependencies

- `useLucideIcon` — dynamic icon resolution
- shadcn-vue `Item` / `ItemMedia` / `ItemContent` / `ItemTitle` / `ItemDescription` primitives
