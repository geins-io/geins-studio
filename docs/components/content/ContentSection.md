# `ContentSection`

A padded `ContentCard` with a built-in `ContentCardHeader` and a content area below it. The standard shell for all entity detail sections.

## Features

- Wraps everything in [`ContentCard`](/components/content/ContentCard) with responsive padding
- Renders a [`ContentCardHeader`](/components/content/ContentCardHeader) with title, description, icon, size, and heading level
- Vertical spacing (`space-y-4`) between the header and the default slot content

## Usage

### Basic Usage

```vue
<template>
  <ContentSection
    title="Customer Details"
    description="Contact information for this customer"
    icon="User"
  >
    <!-- form fields, data lists, etc. -->
  </ContentSection>
</template>
```

### Compact sub-section

```vue
<template>
  <ContentSection
    title="Billing Address"
    size="sm"
    heading-level="h3"
  >
    <ContentAddressDisplay :address="billingAddress" />
  </ContentSection>
</template>
```

## Props

### `title`

```ts
title: string
```

- **Type:** `string`
- **Required:** yes
- **Description:** Section heading text.

### `description`

```ts
description?: string
```

- **Type:** `string`
- **Description:** Secondary text rendered below the title.

### `icon`

```ts
icon?: string
```

- **Type:** `string`
- **Description:** PascalCase Lucide icon name forwarded to `ContentCardHeader`.

### `size`

```ts
size?: 'sm' | 'md' | 'lg'
```

- **Type:** `'sm' | 'md' | 'lg'`
- **Default:** `'md'`
- **Description:** Header size variant forwarded to `ContentCardHeader`.

### `headingLevel`

```ts
headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
```

- **Type:** heading level tag
- **Description:** Forwarded to `ContentCardHeader` for correct document outline.

## Slots

### default

The section body — form fields, data lists, tables, etc.

## Dependencies

- [`ContentCard`](/components/content/ContentCard)
- [`ContentCardHeader`](/components/content/ContentCardHeader)
