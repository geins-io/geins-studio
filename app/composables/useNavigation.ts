import type { NavigationItem } from '#shared/types';
import { navigation as navigationConfig } from '@/lib/navigation';

/**
 * Navigation composable for handling menu items, breadcrumbs, and permissions
 *
 * Features:
 * - Role and permission-based filtering
 * - Active state detection
 * - Automatic breadcrumb generation from navigation structure
 * - Auto-sync with breadcrumbs store
 *
 * @example
 * const { navigationItems, isItemActive, breadcrumbTrail } = useNavigation();
 */
export const useNavigation = () => {
  const userStore = useUserStore();
  const breadcrumbsStore = useBreadcrumbsStore();
  const route = useRoute();

  /**
   * Filter navigation items based on user roles and permissions
   * Recursively processes children and removes empty parent items
   */
  const filterByPermissions = (items: NavigationItem[]): NavigationItem[] => {
    return (
      items
        .filter((item) => {
          // Check roles if specified
          if (item.roles && item.roles.length > 0) {
            if (!userStore.hasAnyRole?.(item.roles)) return false;
          }

          // Check permissions if specified
          if (item.permissions && item.permissions.length > 0) {
            if (!userStore.hasAnyPermission?.(item.permissions)) return false;
          }

          return true;
        })
        .map((item) => ({
          ...item,
          // Recursively filter children
          children: item.children
            ? filterByPermissions(item.children)
            : undefined,
        }))
        // Remove parent items that have no visible children (if they originally had children)
        .filter((item) => {
          // If item had children but all were filtered out, remove it
          if (item.children !== undefined && item.children.length === 0) {
            return false;
          }
          return true;
        })
    );
  };

  /**
   * Get filtered navigation items for current user
   * Items without roles/permissions are visible to all
   */
  const navigationItems = computed(() => {
    // For now, return all items since role/permission methods aren't implemented yet
    // Once userStore has hasAnyRole/hasAnyPermission, uncomment:
    // return filterByPermissions(navigationConfig);
    return navigationConfig;
  });

  /**
   * Check if a navigation item is currently active
   * An item is active if:
   * - The current route matches its href
   * - Any of its children match the current route
   */
  const isItemActive = (item: NavigationItem): boolean => {
    if (item.href === route.path) return true;
    if (item.children) {
      return item.children.some((child) => isItemActive(child));
    }
    return false;
  };

  /**
   * Check if a navigation item should be open (has active children)
   */
  const isItemOpen = (item: NavigationItem): boolean => {
    return item.children?.some((child) => isItemActive(child)) ?? false;
  };

  /**
   * Find breadcrumb trail in navigation structure
   * Returns array of NavigationItems from root to current page
   */
  const findBreadcrumbTrail = (
    items: NavigationItem[],
    targetPath: string,
    ancestors: NavigationItem[] = [],
  ): NavigationItem[] | null => {
    for (const item of items) {
      // Exact match found
      if (item.href === targetPath) {
        return [...ancestors, item];
      }

      // Check children recursively
      if (item.children) {
        const trail = findBreadcrumbTrail(item.children, targetPath, [
          ...ancestors,
          item,
        ]);
        if (trail) {
          return trail;
        }
      }
    }
    return null;
  };

  /**
   * Get breadcrumb trail for current route
   * Auto-derived from navigation structure
   */
  const breadcrumbTrail = computed(() => {
    const trail = findBreadcrumbTrail(navigationItems.value, route.path);
    return trail || [];
  });

  /**
   * Get current page title from navigation
   */
  const currentPageTitle = computed(() => {
    const trail = breadcrumbTrail.value;
    return trail[trail.length - 1]?.label || '';
  });

  /**
   * Get parent navigation item
   */
  const currentParent = computed(() => {
    const trail = breadcrumbTrail.value;
    if (trail.length < 2) return null;
    const parent = trail[trail.length - 2];
    if (!parent) return null;
    return {
      title: parent.label,
      link: parent.href,
    };
  });

  /**
   * Get grandparent navigation item
   */
  const currentGrandparent = computed(() => {
    const trail = breadcrumbTrail.value;
    if (trail.length < 3) return null;
    const grandparent = trail[trail.length - 3];
    if (!grandparent) return null;
    return {
      title: grandparent.label,
      link: grandparent.href,
    };
  });

  /**
   * Auto-sync breadcrumbs to store on route change
   * The store can override individual breadcrumbs if needed
   */
  watch(
    breadcrumbTrail,
    (newTrail) => {
      breadcrumbsStore.setNavigationBreadcrumbs(newTrail);
    },
    { immediate: true },
  );

  return {
    // Filtered navigation items
    navigationItems,

    // State helpers
    isItemActive,
    isItemOpen,

    // Breadcrumb data
    breadcrumbTrail,
    currentPageTitle,
    currentParent,
    currentGrandparent,
  };
};
