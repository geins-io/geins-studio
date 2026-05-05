# `SidebarNavItem`

`SidebarNavItem` is the clickable item used inside [`SidebarNav`](/components/sidebar/SidebarNav) — typically the step picker for selector flows. Maps a `SelectorSelectionOptionsId` to a Lucide icon and emits `click` when activated.

## Features

- Built-in icon map: `product` → `Tag`, `category` → `Shapes`, `brand` → `SwatchBook`, `price` → `CircleDollarSign`, `stock` → `Package`, `import` → `Import`, default → `CopyCheck`
- Active styling via the `current` prop — distinct background on desktop, distinct border on mobile
- Trailing chevron on desktop (hidden on mobile horizontal layout)
- Slot for the label

## Usage

```vue
<template>
  <SidebarNav>
    <SidebarNavItem id="product" :current="active === 'product'" @click="active = 'product'">
      {{ $t('products') }}
    </SidebarNavItem>
  </SidebarNav>
</template>
```

## Props

### `id`

```ts
id: SelectorSelectionOptionsId
```

Drives which Lucide icon renders. Unrecognised ids fall back to `CopyCheck`.

### `current`

```ts
current: boolean
```

Active state — applies the highlighted background/border styling.

## Events

### `click`

Emitted when the user clicks the item. Parent owns the active state.

## Slots

### default

The label text rendered next to the icon.

## Type Definitions

```ts
type SelectorSelectionOptionsId =
  | 'product'
  | 'category'
  | 'brand'
  | 'price'
  | 'stock'
  | 'import'
  | string;
```

(See `shared/types` for the canonical union — used by [`useSelector`](/composables/useSelector).)
