# `LayoutSidebarNav`

`LayoutSidebarNav` is the generic navigation list wrapper used inside selector and step-flow sidebars — a `<nav><ul>` shell that switches between vertical (desktop) and horizontal-scroll (mobile) layouts.

## Features

- Vertical stack on desktop, horizontal scroll on mobile (`max-md:overflow-x-auto`)
- Bottom border separator on mobile only
- Slot-based — children are [`LayoutSidebarNavItem`](/components/layout/sidebar/LayoutSidebarNavItem) instances

## Usage

```vue
<template>
  <LayoutSidebarNav>
    <LayoutSidebarNavItem
      id="product"
      :current="step === 'product'"
      @click="step = 'product'"
    >
      {{ $t('products') }}
    </LayoutSidebarNavItem>
    <LayoutSidebarNavItem
      id="category"
      :current="step === 'category'"
      @click="step = 'category'"
    >
      {{ $t('categories') }}
    </LayoutSidebarNavItem>
  </LayoutSidebarNav>
</template>
```

## Slots

### default

The `LayoutSidebarNavItem` instances.

> [!NOTE]
> This is **not** the app shell sidebar — for that see [`LayoutSidebar`](/components/layout/sidebar/LayoutSidebar). `LayoutSidebarNav` is a content-area helper used by selector flows and step-by-step entity creation.
