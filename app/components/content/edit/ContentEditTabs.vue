<script setup lang="ts">
export interface TabDescriptor {
  label: string;
  error?: boolean;
}

const props = defineProps<{
  tabs: Array<string | TabDescriptor>;
}>();

const { t } = useI18n();

const normalizedTabs = computed<TabDescriptor[]>(() =>
  props.tabs.map((t) => (typeof t === 'string' ? { label: t } : t)),
);

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
  <nav class="w-full overflow-auto">
    <ul class="flex gap-2">
      <li v-for="(tab, index) in normalizedTabs" :key="index">
        <button
          type="button"
          :class="
            cn(
              'text-muted-foreground relative border-b-4 border-transparent px-1.5 py-0.5 text-xs font-bold transition-colors duration-200 ease-in-out sm:px-3 sm:py-1.5 sm:text-sm',
              `${currentTab === index ? 'border-foreground text-foreground' : ''}`,
            )
          "
          @click="setCurrentTab(index)"
        >
          {{ tab.label }}
          <span
            aria-hidden="true"
            :class="
              cn(
                'bg-destructive absolute top-0 right-0 size-1.5 rounded-full transition-opacity duration-150 ease-in-out',
                tab.error ? 'opacity-100' : 'opacity-0',
              )
            "
          />
          <span v-if="tab.error" class="sr-only">{{ t('tab_has_errors') }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>
