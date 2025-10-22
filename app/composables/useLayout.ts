import {
  SIDEBAR_WIDTH_ICON,
  SIDEBAR_WIDTH,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
} from '@/components/ui/sidebar/utils';

interface UseLayoutReturnType {
  sidebarOpen: Ref<boolean>;
  currentSidebarWidth: ComputedRef<string | number>;
  hasLimitedSpace: ComputedRef<boolean>;
  hasReducedSpace: ComputedRef<boolean>;
}

/**
 * Composable for managing layout state and responsive behavior.
 *
 * Handles sidebar visibility, width calculations, and responsive layout
 * adjustments based on viewport size and user preferences.
 *
 * @returns {UseLayoutReturnType} - An object containing layout state and computed properties
 * @property {Ref<boolean>} sidebarOpen - Whether the sidebar is open (persisted in cookie)
 * @property {ComputedRef<number>} currentSidebarWidth - Current sidebar width based on state and viewport
 * @property {ComputedRef<boolean>} hasLimitedSpace - Whether the layout has limited space
 * @property {ComputedRef<boolean>} hasReducedSpace - Whether the layout has reduced space
 */
export const useLayout = (): UseLayoutReturnType => {
  const viewport = useViewport();

  const sidebarOpen = useCookie<boolean>(SIDEBAR_COOKIE_NAME, {
    default: () => true,
    maxAge: SIDEBAR_COOKIE_MAX_AGE,
  });

  const currentSidebarWidth = computed(() => {
    const isLessThanMd = viewport.isLessOrEquals('md');

    if (isLessThanMd) {
      return 0;
    }
    return sidebarOpen.value ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_ICON;
  });

  const hasLimitedSpace = computed(() => {
    const lessThanLg = viewport.isLessThan('xl');
    const lessThanMd = viewport.isLessThan('md');
    return (
      (sidebarOpen.value === true && lessThanLg) ||
      (sidebarOpen.value === false && lessThanMd)
    );
  });

  const hasReducedSpace = computed(() => {
    const lessThanLg = viewport.isLessThan('lg');
    const lessThanXl = viewport.isLessThan('xl');
    return (
      (sidebarOpen.value === false && lessThanLg) ||
      (sidebarOpen.value === true && lessThanXl)
    );
  });

  return {
    sidebarOpen,
    currentSidebarWidth,
    hasLimitedSpace,
    hasReducedSpace,
  };
};
