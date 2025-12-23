<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue';

const { currentSidebarWidth, sidebarOpen } = useLayout();
const route = useRoute();

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
  const pageType = route.meta.pageType;
  return {
    'overflow-hidden': pageType === 'list',
    'overflow-y-auto': pageType !== 'list',
  };
});
</script>
<template>
  <SidebarProvider v-model:open="sidebarOpen">
    <LayoutSidebar />
    <SidebarInset class="@container" :style="mainWidthStyle">
      <LayoutHeader class="sticky top-0 h-(--h-header)" />
      <div
        :class="
          cn('flex grow flex-col p-3 pb-12 @2xl:p-8 @2xl:pb-14', contentClasses)
        "
        :style="mainHeightStyle"
      >
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
  <SpeedInsights />
</template>
