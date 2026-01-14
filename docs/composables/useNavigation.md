# `useNavigation`

The `useNavigation` composable provides utilities for handling navigation menu items, breadcrumbs, active states, and permission-based filtering. It automatically generates and syncs breadcrumb trails from the navigation structure.

:::tip
This composable integrates with the breadcrumbs store and automatically syncs breadcrumb data on route changes.
:::

## Features

- **Role and permission-based filtering** for navigation items
- **Active state detection** for menu highlighting
- **Automatic breadcrumb generation** from navigation structure
- **Auto-sync with breadcrumbs store** on route changes
- **Hierarchical navigation support** with parent/grandparent tracking
- **Localization support** via i18n
- **Partial path matching** for detail pages

## Usage

### Basic Usage

```ts
const { navigationItems, isItemActive, breadcrumbTrail, currentPageTitle } =
  useNavigation();
```

### Navigation Menu

```vue
<script setup lang="ts">
const { navigationItems, isItemActive, isItemOpen } = useNavigation();
</script>

<template>
  <nav>
    <ul>
      <li
        v-for="item in navigationItems"
        :key="item.href"
        :class="{ active: isItemActive(item), open: isItemOpen(item) }"
      >
        <NuxtLink :to="item.href">
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
```

### Breadcrumb Display

```vue
<script setup lang="ts">
const { breadcrumbTrail, currentPageTitle } = useNavigation();
</script>

<template>
  <nav aria-label="Breadcrumb">
    <ol>
      <li v-for="(item, index) in breadcrumbTrail" :key="item.href">
        <NuxtLink v-if="index < breadcrumbTrail.length - 1" :to="item.href">
          {{ item.label }}
        </NuxtLink>
        <span v-else>{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>
```

### Parent/Grandparent Navigation

```vue
<script setup lang="ts">
const { currentParent, currentGrandparent } = useNavigation();
</script>

<template>
  <div v-if="currentParent">
    <NuxtLink :to="currentParent.link">
      ← Back to {{ currentParent.title }}
    </NuxtLink>
  </div>

  <div v-if="currentGrandparent">
    <NuxtLink :to="currentGrandparent.link">
      {{ currentGrandparent.title }}
    </NuxtLink>
  </div>
</template>
```

## API

### Return Type

```ts
interface UseNavigationReturnType {
  navigationItems: ComputedRef<NavigationItem[]>;
  isItemActive: (item: NavigationItem) => boolean;
  isItemOpen: (item: NavigationItem) => boolean;
  breadcrumbTrail: ComputedRef<NavigationItem[]>;
  currentPageTitle: ComputedRef<string>;
  currentParent: ComputedRef<{ title: string; link: string } | null>;
  currentGrandparent: ComputedRef<{ title: string; link: string } | null>;
}
```

### Properties

#### `navigationItems`

- **Type**: `ComputedRef<NavigationItem[]>`
- **Description**: Filtered navigation items based on user roles and permissions
- **Details**: Items without roles/permissions are visible to all users. Recursively filters children and removes parent items with no visible children.

#### `isItemActive`

- **Type**: `(item: NavigationItem) => boolean`
- **Description**: Checks if a navigation item is currently active
- **Logic**: An item is active if:
  - The current route matches its `href`
  - Any of its children match the current route

#### `isItemOpen`

- **Type**: `(item: NavigationItem) => boolean`
- **Description**: Checks if a navigation item should be open (has active children)

#### `breadcrumbTrail`

- **Type**: `ComputedRef<NavigationItem[]>`
- **Description**: Breadcrumb trail for current route, auto-derived from navigation structure
- **Details**: Returns array of NavigationItems from root to current page. Supports partial path matching for detail pages (e.g., `/customers/company/123` matches `/customers/company/list`)

#### `currentPageTitle`

- **Type**: `ComputedRef<string>`
- **Description**: Current page title from navigation structure
- **Details**: Returns the label of the last item in the breadcrumb trail

#### `currentParent`

- **Type**: `ComputedRef<{ title: string; link: string } | null>`
- **Description**: Parent navigation item
- **Details**: Returns the second-to-last item in the breadcrumb trail. Returns `null` if trail has fewer than 2 items.

#### `currentGrandparent`

- **Type**: `ComputedRef<{ title: string; link: string } | null>`
- **Description**: Grandparent navigation item
- **Details**: Returns the third-to-last item in the breadcrumb trail. Returns `null` if trail has fewer than 3 items.

## Navigation Structure

The navigation structure is defined in `app/lib/navigation.ts` and includes:

```ts
interface NavigationItem {
  label: string; // Display text (localized)
  href: string; // Route path
  icon?: Component; // Optional icon component
  roles?: string[]; // Required user roles
  permissions?: string[]; // Required permissions
  children?: NavigationItem[]; // Nested items
}
```

### Example Navigation Config

```ts
export const getNavigation = (
  t: (key: string, count?: number) => string,
): NavigationItem[] => [
  {
    label: t('home'),
    href: '/',
    icon: HomeIcon,
  },
  {
    label: t('customer', 2),
    href: '/customers',
    icon: UsersIcon,
    children: [
      {
        label: t('company', 2),
        href: '/customers/company/list',
      },
    ],
  },
];
```

## Automatic Breadcrumb Sync

The composable automatically syncs breadcrumbs to the breadcrumbs store on route changes:

```ts
watch(
  breadcrumbTrail,
  (newTrail) => {
    breadcrumbsStore.setNavigationBreadcrumbs(newTrail);
  },
  { immediate: true },
);
```

The store can override individual breadcrumbs if needed for custom page titles or dynamic content.

## Path Matching Algorithm

The breadcrumb trail finder uses intelligent path matching:

1. **Exact match priority**: Exact path matches are preferred
2. **Depth-first search**: Children are checked before siblings (prefers deeper exact matches)
3. **Partial matching**: For detail pages, removes `/list` suffix and checks if target path starts with the base
4. **Longest match wins**: When multiple partial matches exist, the longest one is selected

Example:

- Route: `/customers/company/123`
- Matches: `/customers/company/list` (base: `/customers/company`)
- Trail: `Home > Customers > Companies`

## Integration with Breadcrumbs Store

The composable works seamlessly with `useBreadcrumbsStore`:

```ts
const breadcrumbsStore = useBreadcrumbsStore();

// Set navigation config (done automatically)
breadcrumbsStore.setNavigationConfig(navigationConfig);

// Auto-sync breadcrumbs (done automatically)
breadcrumbsStore.setNavigationBreadcrumbs(breadcrumbTrail.value);

// Override breadcrumbs manually if needed
breadcrumbsStore.setBreadcrumbs([{ label: 'Custom', href: '/custom' }]);
```

## Best Practices

1. **Define navigation once**: Use `app/lib/navigation.ts` as single source of truth
2. **Use localization keys**: Always use `t()` function for labels
3. **Consistent paths**: Ensure navigation `href` values match route paths
4. **Permission filtering**: Add `roles` and `permissions` arrays to restrict access
5. **List suffix convention**: Use `/list` suffix for list views to enable partial matching

## Related

- [Breadcrumbs Store](/stores/breadcrumbs)
- [Navigation Config](/lib/navigation)
- [User Store](/stores/user) (for role/permission checks)
