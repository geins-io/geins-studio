# Navigation System Guide

## Overview

The Geins Studio admin system uses a **hybrid navigation approach** that combines:

- **TypeScript-based configuration** for structure and type safety
- **Auto-derived breadcrumbs** from the navigation hierarchy
- **Manual overrides** for dynamic content (e.g., entity names)
- **Role-based access control** (ready for future implementation)

## Architecture

### Components

1. **Navigation Config** (`app/lib/navigation.ts`)
   - Single source of truth for menu structure
   - Defines hierarchy, icons, roles, and permissions
   - Type-safe with TypeScript

2. **useNavigation Composable** (`app/composables/useNavigation.ts`)
   - Filters navigation by roles/permissions
   - Detects active menu items
   - Auto-generates breadcrumb trails
   - Syncs with breadcrumbs store

3. **Breadcrumbs Store** (`app/stores/breadcrumbs.ts`)
   - Receives auto-derived breadcrumbs from navigation
   - Allows manual overrides for dynamic titles
   - Provides computed properties for UI consumption

4. **User Store** (`app/stores/user.ts`)
   - Provides `hasAnyRole()` and `hasAnyPermission()` methods
   - Ready for role/permission implementation

## Usage

### Adding Navigation Items

Edit `app/lib/navigation.ts`:

```typescript
export const navigation: NavigationItem[] = [
  {
    label: 'Products',
    href: '/products/list',
    icon: 'Package', // Icon name from lucide-vue-next
    group: 'catalog',
    roles: ['admin', 'editor'], // Optional: restrict by role
    permissions: ['products.read'], // Optional: restrict by permission
    children: [
      {
        label: 'All Products',
        href: '/products/list',
      },
      {
        label: 'Categories',
        href: '/products/categories',
        permissions: ['categories.manage'],
      },
    ],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: 'Settings',
    divider: true, // Adds visual separator above
    roles: ['admin'],
  },
];
```

### Using in Components

The sidebar automatically uses the navigation composable:

```vue
<!-- Already implemented in LayoutSidebar.vue -->
<script setup>
const { navigationItems, isItemActive } = useNavigation();
</script>
```

### Breadcrumbs

#### Auto-Derived Breadcrumbs

Breadcrumbs are automatically generated from the navigation structure:

```
Dashboard > Wholesale > Accounts
```

**No code needed** - this happens automatically based on the current route!

#### Manual Title Override

For pages with dynamic content (e.g., entity detail pages):

```vue
<script setup>
// app/pages/wholesale/account/[id].vue
const breadcrumbsStore = useBreadcrumbsStore();
const accountName = ref('Acme Corporation');

// Override just the title - hierarchy is automatic!
breadcrumbsStore.setCurrentTitle(accountName.value);

// Result: Dashboard > Wholesale > Accounts > Acme Corporation
</script>
```

#### Manual Parent/Grandparent Override (Rarely Needed)

```vue
<script setup>
// Only needed for special cases outside normal navigation
breadcrumbsStore.setCurrentParent({
  title: 'Custom Parent',
  link: '/custom/parent',
});
</script>
```

## Role-Based Access Control

### Current State

Role/permission checking is **stubbed** and returns `true` (all users can see everything).

### Future Implementation

When you're ready to implement roles:

1. **Add roles/permissions to user session:**

```typescript
// In your auth system
interface User {
  // ... existing fields
  roles?: string[];
  permissions?: string[];
}
```

2. **Update `hasAnyRole` and `hasAnyPermission` in user store:**

```typescript
// app/stores/user.ts
const hasAnyRole = (roles: string[]): boolean => {
  return roles.some((role) => user.value?.roles?.includes(role));
};

const hasAnyPermission = (permissions: string[]): boolean => {
  return permissions.some((perm) => user.value?.permissions?.includes(perm));
};
```

3. **Uncomment the filter in useNavigation:**

```typescript
// app/composables/useNavigation.ts
const navigationItems = computed(() => {
  return filterByPermissions(navigationConfig); // Enable filtering
});
```

4. **Uncomment roles/permissions in navigation config:**

```typescript
// app/lib/navigation.ts
{
  label: 'Wholesale',
  roles: ['admin', 'wholesale_manager'], // Now active!
  permissions: ['wholesale.read'],
  // ...
}
```

## NavigationItem Type

```typescript
interface NavigationItem {
  label: string; // Display text
  href: string; // Route path
  icon?: string; // Icon name from lucide-vue-next
  children?: NavigationItem[]; // Nested items

  // Access control
  roles?: string[]; // Required roles (OR logic)
  permissions?: string[]; // Required permissions (OR logic)

  // UI features
  badge?: string | number; // Notification badge
  divider?: boolean; // Visual separator above
  group?: string; // Logical grouping

  // Extensible
  meta?: Record<string, unknown>;
}
```

## Benefits of This Approach

✅ **Single Source of Truth** - Navigation config defines everything  
✅ **Type Safety** - TypeScript catches errors at compile time  
✅ **Auto Breadcrumbs** - No manual setup on every page  
✅ **Flexible Overrides** - Dynamic titles when needed  
✅ **Role-Ready** - Built for future access control  
✅ **Performance** - No runtime JSON parsing  
✅ **Maintainable** - Easy to add/modify navigation items  
✅ **DX** - IntelliSense and autocomplete

## Migration Notes

### Old Approach (Before)

```vue
<script setup>
// Had to manually set everything on every page
breadcrumbsStore.setCurrentTitle('Account Details');
breadcrumbsStore.setCurrentParent({
  title: 'Accounts',
  link: '/wholesale/account/list',
});
breadcrumbsStore.setCurrentGrandparent({
  title: 'Wholesale',
  link: '/wholesale',
});
</script>
```

### New Approach (After)

```vue
<script setup>
// Only override what's dynamic - hierarchy is automatic!
breadcrumbsStore.setCurrentTitle(accountName.value);
// That's it! Parents are auto-derived from navigation.
</script>
```

## Common Patterns

### Adding a New Section

1. Add to `app/lib/navigation.ts`
2. Create your pages in `app/pages/`
3. Breadcrumbs work automatically ✨

### Dynamic Entity Pages

```vue
<script setup>
const entity = await fetchEntity(route.params.id);

// Override just the title
breadcrumbsStore.setCurrentTitle(entity.name);
</script>
```

### Conditional Navigation Items

Use roles/permissions instead of conditional logic:

```typescript
// ✅ Good
{
  label: 'Admin Panel',
  roles: ['admin'],
  // ...
}

// ❌ Avoid
// Don't conditionally add/remove items - use roles instead
```

## FAQ

**Q: What if a page isn't in the navigation?**  
A: Breadcrumbs will be empty. Set them manually with `setCurrentTitle()` and `setCurrentParent()`.

**Q: Can I have different breadcrumbs than navigation?**  
A: Yes, use the override methods. But consider if the page should be in navigation instead.

**Q: How do I add icons?**  
A: Use icon names from [lucide-vue-next](https://lucide.dev/icons/). Already imported in LayoutSidebar.

**Q: Can children have different permissions than parents?**  
A: Yes! Each item has independent role/permission checks.

**Q: What about badges for notifications?**  
A: Use the `badge` field: `{ label: 'Orders', badge: unreadCount.value }`

## Next Steps

1. ✅ Navigation system is ready to use
2. ⏭️ Add more navigation items as you build features
3. ⏭️ Implement role/permission checking when auth is ready
4. ⏭️ Add notification badges where needed
5. ⏭️ Consider adding search functionality to navigation
