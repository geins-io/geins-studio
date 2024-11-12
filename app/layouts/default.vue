<script setup lang="ts">
const isCollapsed = ref(false);

const currentSidebarWidth = computed(() => {
  return isCollapsed.value ? '3.75rem' : '15rem';
});

const mainWidthStyle = computed(() => {
  return { maxWidth: `calc(100vw - ${currentSidebarWidth.value})` };
});
</script>
<template>
  <div class="flex h-screen overflow-hidden">
    <LayoutSidebar
      v-model:collapsed="isCollapsed"
      :sidebar-width="currentSidebarWidth"
    />
    <main
      class="relative flex grow flex-col transition-[width]"
      :style="mainWidthStyle"
    >
      <LayoutHeader class="sticky top-0 h-header" />
      <div
        class="grow overflow-auto overflow-x-hidden rounded-tl-lg border-l border-t p-8"
      >
        <slot />
      </div>
    </main>
  </div>
</template>
