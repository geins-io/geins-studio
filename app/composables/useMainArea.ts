import {
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
} from '@/components/ui/sidebar/utils';

export const useMainArea = () => {
  const viewport = useViewport();

  const sidebarOpen = useCookie<boolean>(SIDEBAR_COOKIE_NAME, {
    default: () => true,
    maxAge: SIDEBAR_COOKIE_MAX_AGE,
  });

  const isNarrow = computed(() => {
    const lessThanLg = viewport.isLessThan('xl');
    const lessThanMd = viewport.isLessThan('md');
    return (
      (sidebarOpen.value === true && lessThanLg) ||
      (sidebarOpen.value === false && lessThanMd)
    );
  });

  const isMedium = computed(() => {
    const lessThanLg = viewport.isLessThan('lg');
    const lessThanXl = viewport.isLessThan('xl');
    return (
      (sidebarOpen.value === false && lessThanLg) ||
      (sidebarOpen.value === true && lessThanXl)
    );
  });

  return {
    sidebarOpen,
    isNarrow,
    isMedium,
  };
};
