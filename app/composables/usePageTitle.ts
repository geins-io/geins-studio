export interface UsePageTitleReturnType {
  pageTitle: Readonly<Ref<string>>;
}

/**
 * Sets the browser tab title based on the breadcrumb trail.
 * Derives the title from useBreadcrumbsStore, which merges navigation
 * breadcrumbs with any dynamic entity name override (setCurrentTitle).
 *
 * The app name ("Geins Studio") is appended via the global `titleTemplate`
 * defined in app.vue, so this composable only needs to return the
 * breadcrumb-derived portion.
 *
 * Format: "Most Specific - Parent" (titleTemplate appends "- Geins Studio")
 * Examples:
 *   - List page: "Quotations - Orders"
 *   - Edit page: "Q-1001 - Quotations"
 *   - Root:      "Geins Studio" (title is empty → titleTemplate returns app name only)
 *
 * Call this once in the default layout — no per-page setup needed.
 */
export const usePageTitle = (): UsePageTitleReturnType => {
  const breadcrumbsStore = useBreadcrumbsStore();

  const pageTitle = computed(() => {
    const trail = breadcrumbsStore.breadcrumbTrail;
    if (!trail.length) return '';

    const labels = trail.map((item) => item.label).reverse();
    return labels.join(' - ');
  });

  useHead({ title: pageTitle });

  return { pageTitle };
};
