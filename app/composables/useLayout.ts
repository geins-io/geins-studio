import {
  SIDEBAR_WIDTH_ICON,
  SIDEBAR_WIDTH,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
} from '@/components/ui/sidebar/utils';

export const useLayout = () => {
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
