<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue';

const { currentSidebarWidth, sidebarOpen } = useLayout();

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
  console.log('pageType', pageType);
  const classes = ['flex grow flex-col'];

  if (pageType === 'canvas') {

  } else {
    classes.push('p-3 pb-12 @2xl:p-8 @2xl:pb-14');
    if (pageType === 'list') {
      classes.push('overflow-hidden');
    } else {
      classes.push('overflow-y-auto');
    }
  }
  return classes.join(' ');

});
</script>
<template>
  <SidebarProvider v-model:open="sidebarOpen">
    <LayoutSidebar />
    <SidebarInset class="@container" :style="mainWidthStyle">
      <LayoutHeader class="sticky top-0 h-(--h-header)" />
      <div :class="cn(contentClasses)" :style="mainHeightStyle">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
  <SpeedInsights />
</template>
