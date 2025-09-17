<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    showSidebar?: boolean;
  }>(),
  {
    showSidebar: true,
  },
);

const initialSidebarVisible = toRef(props, 'showSidebar');
const slots = useSlots();
const hasSidebar = computed(() => !!slots.sidebar);
const sidebarCanBeToggled = ref(
  hasSidebar.value && !initialSidebarVisible.value,
);
const sidebarToggled = ref(false);
const sidebarVisible = ref(initialSidebarVisible.value);

watch(initialSidebarVisible, (newValue) => {
  sidebarToggled.value = false;
  sidebarCanBeToggled.value = hasSidebar.value && !newValue;
});

const handleToggleSidebar = () => {
  if (!sidebarToggled.value) {
    sidebarVisible.value = false;
    sidebarToggled.value = true;
    setTimeout(() => {
      sidebarVisible.value = true;
    }, 10);
  } else {
    sidebarVisible.value = false;
    setTimeout(() => {
      sidebarToggled.value = false;
    }, 300);
  }
};
</script>
<template>
  <div class="relative">
    <TooltipProvider v-if="sidebarCanBeToggled">
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="bg-card flex-center translate- absolute top-4 right-0 z-50 h-8 w-7 translate-x-full rounded-r-lg border border-l-0"
            @click="handleToggleSidebar"
          >
            <LucideList class="text-muted-foreground size-10 p-1" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {{
            sidebarToggled
              ? $t('hide_entity', { entityName: 'summary' })
              : $t('show_entity', { entityName: 'summary' })
          }}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <div
      :class="
        cn(
          `grid gap-4`,
          `${!hasSidebar || sidebarCanBeToggled ? 'grid-cols-1' : 'grid-cols-(--grid-cols-main)'}`,
        )
      "
    >
      <slot />
      <div v-if="hasSidebar" class="flex flex-col gap-4">
        <div
          v-show="initialSidebarVisible || sidebarToggled"
          :class="
            cn(
              'rounded-lg',
              sidebarCanBeToggled
                ? 'absolute top-4 right-4 z-50 w-[360px] origin-top-right shadow-lg transition-all duration-300 ease-[cubic-bezier(.29,.38,.18,1.47)]'
                : '',
              sidebarCanBeToggled && sidebarVisible
                ? 'scale-100 opacity-100'
                : '',
              sidebarCanBeToggled && !sidebarVisible ? 'scale-0 opacity-0' : '',
            )
          "
        >
          <slot name="sidebar" />
        </div>
      </div>
    </div>
    <div v-if="!!slots.secondary" class="mt-4">
      <slot name="secondary" />
    </div>
  </div>
</template>
