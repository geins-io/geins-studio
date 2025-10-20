# `useBreadcrumbsStore`

The `useBreadcrumbsStore` Pinia store manages breadcrumb navigation state throughout the application. It provides reactive breadcrumb visibility, current page title tracking, and parent navigation context with automatic route-based updates.

## Features

- **Dynamic title management** for current page context
- **Manual visibility control** for special cases

## Usage

```ts
import { useBreadcrumbsStore } from '@/stores/breadcrumbs';

const breadcrumbsStore = useBreadcrumbsStore();

// Access reactive state
const { showBreadcrumbs, currentTitle, currentParent } =
  storeToRefs(breadcrumbsStore);

// Update breadcrumb state
breadcrumbsStore.setCurrentTitle('Product Details');
breadcrumbsStore.setCurrentParent({ title: 'Products', link: '/products' });
```

## Properties

### `showBreadcrumbs`

A `ref` that controls whether breadcrumbs should be displayed.

- **Type**: `Ref<boolean>`
- **Default**: `true`
- **Auto-update**: Set to `false` when route path is `/` (home page)

### `currentTitle`

A `ref` containing the title of the current page for breadcrumb display.

- **Type**: `Ref<string>`
- **Default**: Empty string
- **Usage**: Display the current page name in breadcrumb trail

### `currentParent`

A `ref` containing the parent navigation context for the current page.

- **Type**: `Ref<{ title: string; link: string } | boolean | undefined>`
- **Values**:
  - Object with `title` and `link` for navigable parent
  - `false` for no parent
  - `undefined` for unset state

## Methods

### `setCurrentTitle`

```ts
setCurrentTitle(title: string): void
```

Sets the current page title for breadcrumb display.

- **Parameters:**
  - `title`: The title to display for the current page

### `setCurrentParent`

```ts
setCurrentParent(parent?: { title: string; link: string }): void
```

Sets the parent navigation context for the current page.

- **Parameters:**
  - `parent`: Optional parent object with title and link, or undefined to clear

### `setShowBreadcrumbs`

```ts
setShowBreadcrumbs(show: boolean): void
```

Manually controls breadcrumb visibility.

- **Parameters:**
  - `show`: Boolean to show or hide breadcrumbs

## Example

```vue
<script setup lang="ts">
const breadcrumbsStore = useBreadcrumbsStore();
const { showBreadcrumbs, currentTitle, currentParent } = breadcrumbsStore;

// Set up breadcrumbs for a product detail page
onMounted(() => {
  breadcrumbsStore.setCurrentTitle('Product Details');
  breadcrumbsStore.setCurrentParent({
    title: 'Products',
    link: '/products',
  });
});

// Clear parent when leaving page
onUnmounted(() => {
  breadcrumbsStore.setCurrentParent();
});
</script>
```

## Type Definitions

```ts
function useBreadcrumbsStore(): BreadcrumbsStoreReturnType;

interface BreadcrumbsStoreReturnType {
  showBreadcrumbs: Ref<boolean>;
  currentTitle: Ref<string>;
  currentParent: Ref<{ title: string; link: string } | boolean | undefined>;
  setCurrentTitle: (title: string) => void;
  setCurrentParent: (parent?: { title: string; link: string }) => void;
  setShowBreadcrumbs: (show: boolean) => void;
}

interface BreadcrumbParent {
  title: string;
  link: string;
}
```

## Dependencies

This store depends on:

1. **Pinia**: For store management
