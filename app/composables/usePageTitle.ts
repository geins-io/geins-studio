const APP_NAME = 'Geins Studio';

export interface UsePageTitleReturnType {
  pageTitle: Readonly<Ref<string>>;
}

/**
 * Sets the browser tab title based on the breadcrumb trail.
 * Derives the title from useBreadcrumbsStore, which merges navigation
 * breadcrumbs with any dynamic entity name override (setCurrentTitle).
 *
 * Format: "Most Specific - Parent - Geins Studio"
 * Examples:
 *   - List page: "Quotations - Orders - Geins Studio"
 *   - Edit page: "Q-1001 - Quotations - Geins Studio"
 *   - Root:      "Geins Studio"
 *
 * Call this once in the default layout — no per-page setup needed.
 */
export const usePageTitle = (): UsePageTitleReturnType => {
  const breadcrumbsStore = useBreadcrumbsStore();

  const pageTitle = computed(() => {
    const trail = breadcrumbsStore.breadcrumbTrail;
    if (!trail.length) return APP_NAME;

    const labels = trail.map((item) => item.label).reverse();
    return `${labels.join(' - ')} - ${APP_NAME}`;
  });

  useHead({ title: pageTitle });

  return { pageTitle };
};
