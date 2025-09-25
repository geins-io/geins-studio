<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue';

import {
  SIDEBAR_WIDTH_ICON,
  SIDEBAR_WIDTH,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
} from '../components/ui/sidebar/utils';

const viewport = useViewport();

const currentSidebarWidth = computed(() => {
  const isLessThanMd = viewport.isLessThan('md');

  if (isLessThanMd) {
    return 0;
  }
  return defaultOpen.value ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_ICON;
});

// Use Nuxt's cookie for persistence
const defaultOpen = useCookie<boolean>(SIDEBAR_COOKIE_NAME, {
  default: () => true,
  maxAge: SIDEBAR_COOKIE_MAX_AGE,
});

const mainWidthStyle = computed(() => {
  const sidebarWidth = currentSidebarWidth.value;

  if (sidebarWidth === 0) {
    return { maxWidth: '100vw' };
  }

  return { maxWidth: `calc(100vw - ${sidebarWidth})` };
});

const mainHeightStyle = computed(() => {
  return { height: `calc(100vh - var(--h-header))` };
});

const contentClasses = computed(() => {
  const route = useRoute();
  const pageType = route.meta.pageType;
  return {
    'overflow-hidden': pageType === 'list',
    'overflow-y-auto': pageType !== 'list',
  };
});
</script>
<template>
  <SidebarProvider v-model:open="defaultOpen">
    <LayoutSidebar />
    <SidebarInset :style="mainWidthStyle">
      <LayoutHeader class="sticky top-0 h-(--h-header)" />
      <div
        :class="
          cn('flex grow flex-col p-3 pb-12 sm:p-8 sm:pb-14', contentClasses)
        "
        :style="mainHeightStyle"
      >
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
  <SpeedInsights />
</template>
