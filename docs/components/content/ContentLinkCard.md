# `ContentLinkCard`

A clickable card that navigates to an internal route. Displays a title and description via [`ContentCardHeader`](/components/content/ContentCardHeader) and an icon indicating whether the link leads to a list or a create form.

## Features

- Wraps in a `NuxtLink` for SPA navigation
- `linkType: 'list'` shows a `ChevronRight` arrow; `'create'` shows a `Plus`
- Hover state highlights the card border

## Usage

### Basic Usage

```vue
<template>
  <ContentLinkCard
    title="Orders"
    description="View and manage all orders"
    link="/orders/list"
    link-type="list"
  />
</template>
```

### Create shortcut

```vue
<template>
  <ContentLinkCard
    title="New Customer"
    description="Create a new customer account"
    link="/customers/new"
    link-type="create"
  />
</template>
```

## Props

### `title`

```ts
title?: string
```

- **Type:** `string`
- **Default:** `'Card Title'`
- **Description:** Primary heading text displayed on the card.

### `description`

```ts
description?: string
```

- **Type:** `string`
- **Default:** `'Card Description'`
- **Description:** Secondary text displayed below the title.

### `link`

```ts
link?: string
```

- **Type:** `string`
- **Default:** `'#'`
- **Description:** The route path the card navigates to.

### `linkType`

```ts
linkType?: 'create' | 'list'
```

- **Type:** `'create' | 'list'`
- **Default:** `'list'`
- **Description:** Controls the trailing icon. `'list'` → `ChevronRight`; `'create'` → `Plus`.

## Dependencies

- [`ContentCardHeader`](/components/content/ContentCardHeader)
- shadcn-vue [`Card`](/components/shadcn-vue)
