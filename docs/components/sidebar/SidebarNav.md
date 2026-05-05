# `SidebarNav`

`SidebarNav` is the generic navigation list wrapper used inside selector and step-flow sidebars — a `<nav><ul>` shell that switches between vertical (desktop) and horizontal-scroll (mobile) layouts.

## Features

- Vertical stack on desktop, horizontal scroll on mobile (`max-md:overflow-x-auto`)
- Bottom border separator on mobile only
- Slot-based — children are [`SidebarNavItem`](/components/sidebar/SidebarNavItem) instances

## Usage

```vue
<template>
  <SidebarNav>
    <SidebarNavItem id="product" :current="step === 'product'" @click="step = 'product'">
      {{ $t('products') }}
    </SidebarNavItem>
    <SidebarNavItem id="category" :current="step === 'category'" @click="step = 'category'">
      {{ $t('categories') }}
    </SidebarNavItem>
  </SidebarNav>
</template>
```

## Slots

### default

The `SidebarNavItem` instances.

> [!NOTE]
> This is **not** the app shell sidebar — for that see [`LayoutSidebar`](/components/layout/sidebar/LayoutSidebar). `SidebarNav` is a content-area helper used by selector flows and step-by-step entity creation.
