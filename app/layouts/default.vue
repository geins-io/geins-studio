<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue';

import {
  SIDEBAR_WIDTH_ICON,
  SIDEBAR_WIDTH,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
} from '../components/ui/sidebar/utils';

const viewport = useViewport();

// Debug: watch breakpoint changes
watch(viewport.breakpoint, (newBreakpoint, oldBreakpoint) => {
  console.log('Breakpoint changed:', oldBreakpoint, '->', newBreakpoint);
  console.log('isLessThan md:', viewport.isLessThan('md'));
});

const currentSidebarWidth = computed(() => {
  // Access .value to establish reactive dependency
  const currentBreakpoint = viewport.breakpoint.value;
  const isLessThanMd = viewport.isLessThan('md');

  console.log('Computing sidebar width:', { currentBreakpoint, isLessThanMd });

  if (isLessThanMd) {
    console.log('returning 0 for mobile');
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
  return { maxWidth: `calc(100vw - ${currentSidebarWidth.value})` };
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
        :class="cn('flex grow flex-col p-8 pb-14', contentClasses)"
        :style="mainHeightStyle"
      >
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
  <SpeedInsights />
</template>
