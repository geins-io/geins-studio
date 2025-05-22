<script setup lang="ts">
const isCollapsed = useCookie<boolean>('geins-sidebar-collapsed', {
  default: () => true,
  maxAge: 60 * 60 * 24 * 365,
});

isCollapsed.value = isCollapsed.value !== undefined ? isCollapsed.value : true;

const currentSidebarWidth = computed(() => {
  return isCollapsed.value ? '3.75rem' : '15rem';
});

const mainWidthStyle = computed(() => {
  return { maxWidth: `calc(100vw - ${currentSidebarWidth.value})` };
});

const mainContentStyle = computed(() => {
  return { height: `calc(100vh - 4rem)` };
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
  <div class="flex h-screen overflow-hidden">
    <LayoutSidebar :sidebar-width="currentSidebarWidth" />
    <main
      class="relative flex grow flex-col transition-[max-width]"
      :style="mainWidthStyle"
    >
      <LayoutHeader class="sticky top-0 h-header" />
      <div
        :class="cn('flex grow flex-col p-8 pb-14', contentClasses)"
        :style="mainContentStyle"
      >
        <slot />
      </div>
    </main>
  </div>
</template>
