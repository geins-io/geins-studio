# `SelectorTag`

A compact removable badge displaying a single selection condition label. Used inside [`SelectorTags`](/components/selector/SelectorTags) to represent a category, brand, price rule, or stock rule.

## Features

- Optional remove button (enabled by default)
- Consistent pill styling with border and background

## Usage

### Basic Usage

```vue
<template>
  <SelectorTag label="T-Shirts" @remove="removeCategory('t-shirts')" />
</template>
```

### Non-removable tag

```vue
<template>
  <SelectorTag label="All products" :removable="false" />
</template>
```

## Props

### `label`

```ts
label: string
```

- **Type:** `string`
- **Required:** yes
- **Description:** The text displayed inside the badge.

### `removable`

```ts
removable?: boolean
```

- **Type:** `boolean`
- **Default:** `true`
- **Description:** When `false`, hides the × remove button. Use for synthetic tags like "All products".

## Events

### `remove`

```ts
(e: 'remove'): void
```

Emitted when the × button is clicked. Only fired when `removable` is `true`.

## Dependencies

None — pure layout with Lucide `X` icon.
