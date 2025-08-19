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
  console.log('🚀 ~ newValue:', newValue);
  sidebarToggled.value = false;
  sidebarCanBeToggled.value = hasSidebar.value && !newValue;
});

const handleToggleSidebar = () => {
  if (!sidebarToggled.value) {
    sidebarToggled.value = true;
    nextTick(() => {
      sidebarVisible.value = true;
    });
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
    <button
      v-if="sidebarCanBeToggled"
      class="bg-card flex-center absolute -top-2 -right-2 z-50 size-10 rounded-full border p-2 shadow-lg"
      @click="handleToggleSidebar"
    >
      <LucideSquareEqual class="size-4" />
    </button>
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
          v-show="(!sidebarCanBeToggled && sidebarVisible) || sidebarToggled"
          :class="
            cn(
              sidebarCanBeToggled
                ? 'absolute top-8 right-8 z-50 w-[360px] origin-top-right shadow-lg transition-all duration-300 ease-out'
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
