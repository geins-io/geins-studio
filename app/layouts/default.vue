<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue';

// Use Nuxt's cookie for persistence
const defaultOpen = useCookie<boolean>('sidebar:state', {
  default: () => true,
  maxAge: 60 * 60 * 24 * 7, // 7 days
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
    <SidebarInset>
      <LayoutHeader class="sticky top-0 h-(--h-header)" />
      <main
        :class="cn('flex grow flex-col p-8 pb-14', contentClasses)"
        style="height: calc(100vh - 3rem)"
      >
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>
  <SpeedInsights />
</template>
