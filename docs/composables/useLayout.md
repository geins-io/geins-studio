# `useLayout`

The `useLayout` composable manages layout state and responsive behavior throughout the application. It provides reactive properties for sidebar management, responsive breakpoints, and space calculations based on viewport size and user preferences.

## Features

- **Sidebar state management** with persistent cookie storage
- **Responsive layout calculations** based on viewport size
- **Space constraint detection** for adaptive UI layouts

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const { sidebarOpen, hasReducedSpace, currentSidebarWidth } = useLayout();

// Toggle sidebar
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside
      :class="{ 'sidebar-open': sidebarOpen, 'sidebar-closed': !sidebarOpen }"
      :style="{ width: currentSidebarWidth }"
    >
      <!-- Sidebar content -->
    </aside>

    <!-- Main content -->
    <main :class="{ 'content-reduced': hasReducedSpace }">
      <Button @click="toggleSidebar">
        {{ sidebarOpen ? 'Close' : 'Open' }} Sidebar
      </Button>
      <!-- Page content -->
    </main>
  </div>
</template>
```

## Properties and Methods

### `sidebarOpen`

A cookied `ref` that indicates whether the sidebar is currently open or closed. The state is persisted in a cookie named `geins-sidebar-collapsed`.

### `currentSidebarWidth`

A `computed` property that returns the current width of the sidebar based on its open/closed state. It uses predefined constants for full and icon-only widths.

### `hasLimitedSpace`

A `computed` property indicating whether the layout has limited space available. Returns `true` when:

- Sidebar is **open** AND viewport is **less than xl**
- Sidebar is **closed** AND viewport is **less than md**

Use this for major layout adjustments like hiding secondary content or switching to mobile layouts.

### `hasReducedSpace`

A `computed` property indicating whether the layout has reduced space available. Returns `true` when:

- Sidebar is **closed** AND viewport is **less than lg**
- Sidebar is **open** AND viewport is **less than xl**

Use this for moderate layout adjustments like reducing column counts or compacting components.

## Type Definitions

```ts
function useLayout(): UseLayoutReturnType;

interface UseLayoutReturnType {
  sidebarOpen: Ref<boolean>;
  currentSidebarWidth: ComputedRef<string | number>;
  hasLimitedSpace: ComputedRef<boolean>;
  hasReducedSpace: ComputedRef<boolean>;
}
```

## Dependencies

This composable depends on:

1. **`useViewport`**: For responsive breakpoint detection
2. **`useCookie`**: For persistent sidebar state storage
3. **Shadcn sidebar utility constants**: For consistent width values
