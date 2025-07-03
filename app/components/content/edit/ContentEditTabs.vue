<script setup lang="ts">
import { onMounted, watch, nextTick, unref } from 'vue';
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
  if (route.query?.tab && typeof route.query.tab === 'string') {
    currentTab.value = parseInt(route.query.tab);
  }
});

// Watch for changes on currentTab and update the URL query without pushing a new history entry.
watch(currentTab, async (value) => {
  // Additional safety checks for hot reload
  if (typeof value !== 'number' || value < 0) {
    return;
  }

  try {
    // Get current route state safely
    const currentRoute = unref(route);
    const currentRouter = unref(router);

    // Ensure route and query are available before proceeding
    if (!currentRoute || !currentRoute.query || !currentRouter) {
      return;
    }

    // Wait for next tick to ensure DOM is ready
    await nextTick();

    // Clone the current query parameters safely
    const query = { ...currentRoute.query };

    // Remove tab parameter if it is 0, or update it otherwise.
    if (value === 0) {
      delete query.tab;
    } else {
      query.tab = value.toString();
    }

    // Replace the current route so that no new history entry is created.
    await currentRouter.replace({ query });
  } catch (error) {
    // Silently ignore errors during hot reload
    if (import.meta.dev) {
      console.warn('Tab navigation update failed during hot reload:', error);
    }
  }
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
              `${currentTab === index ? 'border-foreground text-foreground' : ''}`,
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
