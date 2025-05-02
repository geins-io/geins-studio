<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const _props = defineProps<{
  tabs: string[];
}>();

const currentTab = defineModel<number>('currentTab');
const setCurrentTab = (value: number) => {
  currentTab.value = value;
};

const route = useRoute();
const router = useRouter();

onMounted(() => {
  // Initialize currentTab from route query parameter
  const tabParam = route.query.tab;
  if (tabParam && typeof tabParam === 'string') {
    currentTab.value = parseInt(tabParam);
  }

  // Watch for changes on currentTab and update the URL query without pushing a new history entry.
  watch(
    currentTab,
    (value) => {
      // Clone the current query parameters
      const query = { ...route.query };

      // Remove tab parameter if it is 0, or update it otherwise.
      if (value === 0) {
        delete query.tab;
      } else if (value) {
        query.tab = value.toString();
      }

      // Replace the current route so that no new history entry is created.
      router.replace({ query });
    },
    { immediate: true },
  );
});
</script>

<template>
  <nav class="w-full">
    <ul class="flex gap-2">
      <li v-for="(tab, index) in tabs" :key="index">
        <button
          type="button"
          :class="
            cn(
              'border-b-4 border-transparent px-3 py-1.5 text-sm font-bold text-muted-foreground transition-colors duration-200 ease-in-out',
              `${currentTab === index ? 'border-primary text-primary' : ''}`,
            )
          "
          @click="setCurrentTab(index)"
        >
          {{ tab }}
        </button>
      </li>
    </ul>
  </nav>
</template>
