<script setup lang="ts">
const _props = defineProps<{
  tabs: string[];
}>();

const currentTab = defineModel<number>('currentTab');
const setCurrentTab = (value: number) => {
  currentTab.value = value;
};

onMounted(() => {
  const url = new URL(window.location.href);
  const tabParam = url.searchParams.get('tab');
  if (tabParam) {
    currentTab.value = parseInt(tabParam);
  }
  // watch for changes and update url
  watch(
    currentTab,
    (value) => {
      if (value === 0) {
        url.searchParams.delete('tab');
      } else if (value) {
        url.searchParams.set('tab', value.toString());
      }
      window.history.pushState({}, '', url);
    },
    { immediate: true },
  );
});
</script>
<template>
  <nav class="w-full">
    <ul class="flex gap-2">
      <li v-for="(tab, index) in tabs" :key="index">
        <Button
          variant="ghost"
          :class="
            cn(
              `${currentTab === index ? 'border-border bg-card hover:bg-card' : ''}`,
            )
          "
          @click="setCurrentTab(index)"
        >
          {{ tab }}
        </Button>
      </li>
    </ul>
  </nav>
</template>
