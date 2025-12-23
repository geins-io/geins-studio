import { defineStore } from 'pinia';
import type { NavigationItem } from '#shared/types';

/**
 * Breadcrumbs store with hybrid approach:
 * - Auto-derives breadcrumb hierarchy from navigation config (via useNavigation)
 * - Allows manual overrides for dynamic titles and special cases
 *
 * This gives the best of both worlds:
 * - Structure comes from navigation (single source of truth)
 * - Flexibility for pages with dynamic content (e.g., "Account #12345")
 */
export const useBreadcrumbsStore = defineStore('breadcrumbs', () => {
  const showBreadcrumbs = ref(true);

  // Auto-derived from navigation (set by useNavigation composable)
  const navigationBreadcrumbs = ref<NavigationItem[]>([]);

  // Store the full navigation config (set by useNavigation composable)
  const navigationConfig = ref<NavigationItem[]>([]);

  // Override options - when set, these APPEND to the navigation breadcrumbs
  const titleOverride = ref<string | null>(null);
  const replaceLast = ref(false); // If true, replaces last breadcrumb instead of appending
  const parentOverride = ref<{ title: string; link: string } | null>(null);
  const grandparentOverride = ref<{ title: string; link: string } | null>(null);

  const route = useRoute();

  /**
   * Check if a path matches a childPattern
   * Example: '/customers/account/:id' matches '/customers/account/123'
   */
  const matchesChildPattern = (path: string, pattern: string): boolean => {
    const patternSegments = pattern.split('/');
    const pathSegments = path.split('/');

    if (patternSegments.length !== pathSegments.length) return false;

    return patternSegments.every((segment, index) => {
      return segment.startsWith(':') || segment === pathSegments[index];
    });
  };

  /**
   * Find all navigation items (recursively) that have childPatterns
   */
  const getAllItemsWithChildPatterns = (
    items: NavigationItem[],
  ): NavigationItem[] => {
    const result: NavigationItem[] = [];
    for (const item of items) {
      if (item.childPattern) {
        result.push(item);
      }
      if (item.children) {
        result.push(...getAllItemsWithChildPatterns(item.children));
      }
    }
    return result;
  };

  /**
   * Check if current route is a child page (matches a childPattern)
   * Excludes exact navigation item hrefs (e.g., list pages)
   */
  const isOnChildPage = (
    currentPath: string,
    navItems: NavigationItem[],
  ): boolean => {
    const itemsWithPatterns = getAllItemsWithChildPatterns(navItems);

    // Check if path matches any childPattern
    const matchesPattern = itemsWithPatterns.some((item) => {
      // Don't match if the path is the exact href of the navigation item
      // (e.g., /customers/account/list should NOT match the childPattern)
      if (currentPath === item.href) {
        return false;
      }

      return matchesChildPattern(currentPath, item.childPattern!);
    });

    return matchesPattern;
  };

  watch(
    () => route.path,
    (newPath, oldPath) => {
      showBreadcrumbs.value = newPath !== '/';

      // Auto-clear override when navigating AWAY from a child page
      if (oldPath && newPath !== oldPath && titleOverride.value) {
        // Use stored navigation config
        const wasOnChildPage = isOnChildPage(oldPath, navigationConfig.value);
        const isNowOnChildPage = isOnChildPage(newPath, navigationConfig.value);

        // If we were on a child page (with override) and now we're NOT, clear it
        if (wasOnChildPage && !isNowOnChildPage) {
          clearOverrides();
        }
      }
    },
    { deep: true },
  );

  /**
   * Full breadcrumb trail combining navigation + overrides
   * Returns the navigation breadcrumbs with title override either:
   * - APPENDED as a new item (replace=false, default) - for entity detail pages
   * - REPLACING the last item (replace=true) - for pages that want to override the final breadcrumb
   */
  const breadcrumbTrail = computed(() => {
    const trail = [...navigationBreadcrumbs.value];

    if (titleOverride.value) {
      if (replaceLast.value) {
        // Replace the last breadcrumb item with the override
        if (trail.length > 0) {
          trail[trail.length - 1] = {
            label: titleOverride.value,
            href: route.path,
          };
        }
      } else {
        // Append title override as a NEW breadcrumb item (default behavior)
        trail.push({
          label: titleOverride.value,
          href: route.path,
        });
      }
    }

    return trail;
  });

  /**
   * Current page title
   * Uses override if set, otherwise derives from navigation
   */
  const currentTitle = computed(() => {
    return (
      titleOverride.value ||
      navigationBreadcrumbs.value[navigationBreadcrumbs.value.length - 1]
        ?.label ||
      ''
    );
  });

  /**
   * Parent breadcrumb item
   * Uses override if set, otherwise derives from navigation
   */
  const currentParent = computed(() => {
    if (parentOverride.value) return parentOverride.value;

    const parent =
      navigationBreadcrumbs.value[navigationBreadcrumbs.value.length - 2];
    return parent ? { title: parent.label, link: parent.href } : false;
  });

  /**
   * Grandparent breadcrumb item
   * Uses override if set, otherwise derives from navigation
   */
  const currentGrandparent = computed(() => {
    if (grandparentOverride.value) return grandparentOverride.value;

    const grandparent =
      navigationBreadcrumbs.value[navigationBreadcrumbs.value.length - 3];
    return grandparent
      ? { title: grandparent.label, link: grandparent.href }
      : false;
  });

  /**
   * Set navigation-derived breadcrumbs
   * Called automatically by useNavigation composable
   */
  const setNavigationBreadcrumbs = (items: NavigationItem[]) => {
    navigationBreadcrumbs.value = items;
  };

  /**
   * Set a dynamic title for the current page
   *
   * @param title - The title to display (e.g., "John Doe", "Acme Corporation")
   * @param replace - If true, replaces the last breadcrumb; if false (default), appends as new item
   *
   * Examples:
   * - replace=false: "Customer > Accounts" + "Acme Corp" = "Customer > Accounts > Acme Corp"
   * - replace=true: "Account > Profile" + "John Doe" = "Account > John Doe"
   */
  const setCurrentTitle = (title: string, replace = false) => {
    titleOverride.value = title;
    replaceLast.value = replace;
  };

  /**
   * Override the parent breadcrumb
   * Rarely needed - navigation usually handles this automatically
   */
  const setCurrentParent = (parent?: { title: string; link: string }) => {
    parentOverride.value = parent || null;
  };

  /**
   * Override the grandparent breadcrumb
   * Rarely needed - navigation usually handles this automatically
   */
  const setCurrentGrandparent = (grandparent?: {
    title: string;
    link: string;
  }) => {
    grandparentOverride.value = grandparent || null;
  };

  /**
   * Clear all manual overrides
   * Call this manually when leaving a page if needed
   */
  const clearOverrides = () => {
    titleOverride.value = null;
    replaceLast.value = false; // Reset to default
    parentOverride.value = null;
    grandparentOverride.value = null;
  };

  /**
   * Toggle breadcrumbs visibility
   */
  const setShowBreadcrumbs = (show: boolean) => {
    showBreadcrumbs.value = show;
  };

  /**
   * Set the navigation config (called by useNavigation)
   */
  const setNavigationConfig = (config: NavigationItem[]) => {
    navigationConfig.value = config;
  };

  return {
    // State
    showBreadcrumbs,
    breadcrumbTrail,
    currentTitle,
    currentParent,
    currentGrandparent,

    // Methods
    setNavigationBreadcrumbs,
    setNavigationConfig,
    setCurrentTitle,
    setCurrentParent,
    setCurrentGrandparent,
    clearOverrides,
    setShowBreadcrumbs,
  };
});
