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

  // Override options - when set, these take precedence
  const titleOverride = ref<string | null>(null);
  const parentOverride = ref<{ title: string; link: string } | null>(null);
  const grandparentOverride = ref<{ title: string; link: string } | null>(null);

  const route = useRoute();

  watch(
    route,
    () => {
      showBreadcrumbs.value = route.path !== '/';
      // Clear overrides on route change so pages can set fresh values
      clearOverrides();
    },
    { deep: true },
  );

  /**
   * Full breadcrumb trail combining navigation + overrides
   * Returns the navigation breadcrumbs with any manual overrides applied
   */
  const breadcrumbTrail = computed(() => {
    const trail = [...navigationBreadcrumbs.value];

    // Apply title override to the last item if set
    if (titleOverride.value && trail.length > 0) {
      const lastItem = trail[trail.length - 1];
      if (lastItem) {
        trail[trail.length - 1] = {
          ...lastItem,
          label: titleOverride.value,
        };
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
   * Override the current page title
   * Useful for dynamic entity pages (e.g., "Acme Corporation" instead of "Accounts")
   */
  const setCurrentTitle = (title: string) => {
    titleOverride.value = title;
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
   * Called automatically on route change
   */
  const clearOverrides = () => {
    titleOverride.value = null;
    parentOverride.value = null;
    grandparentOverride.value = null;
  };

  /**
   * Toggle breadcrumbs visibility
   */
  const setShowBreadcrumbs = (show: boolean) => {
    showBreadcrumbs.value = show;
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
    setCurrentTitle,
    setCurrentParent,
    setCurrentGrandparent,
    clearOverrides,
    setShowBreadcrumbs,
  };
});
