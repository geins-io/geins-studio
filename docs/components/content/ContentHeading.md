# `ContentHeading`

A small section label rendered as a semantic HTML element with size-responsive typography. Used above grouped content inside panels and cards.

## Features

- Polymorphic — renders as any heading tag or `p`/`span` via the `as` prop
- Four sizes: `s` (default), `m`, `l`, `xl`
- Content is projected through the default slot

## Usage

### Basic Usage

```vue
<template>
  <ContentHeading>Selected items</ContentHeading>
</template>
```

### With custom tag and size

```vue
<template>
  <ContentHeading as="h3" size="m">Browse products</ContentHeading>
</template>
```

## Props

### `as`

```ts
as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
```

- **Type:** heading or inline tag
- **Default:** `'p'`
- **Description:** The HTML element to render. Use a heading tag when the label belongs to the document outline.

### `size`

```ts
size?: 's' | 'm' | 'l' | 'xl'
```

- **Type:** `'s' | 'm' | 'l' | 'xl'`
- **Default:** `'s'`
- **Description:** Controls font size and bottom margin. `s` → `text-sm`; `m` → `text-xl`; `l` → `text-3xl`.

## Slots

### default

The heading text to render.

## Dependencies

None — pure layout component.
