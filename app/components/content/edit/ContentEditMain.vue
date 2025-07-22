<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    sidebarHidden?: boolean;
  }>(),
  {
    sidebarHidden: false,
  },
);

const sidebarHidden = toRef(props, 'sidebarHidden');
const slots = useSlots();
const hasSidebar = computed(() => !!slots.sidebar);
const sidebarVisible = ref(!sidebarHidden.value);
const sidebarToggled = ref(false);

watch(sidebarHidden, (newValue) => {
  sidebarVisible.value = !newValue;
  sidebarToggled.value = !newValue;
});

const handleToggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
  sidebarToggled.value = !sidebarToggled.value;
};
</script>
<template>
  <div class="relative">
    <button
      v-if="sidebarHidden"
      class="bg-card flex-center absolute -top-2 -right-2 z-50 size-10 rounded-full border p-2 shadow-lg"
      @click="handleToggleSidebar"
    >
      <LucideSquareEqual class="size-4" />
    </button>
    <div
      :class="
        cn(
          `grid gap-4`,
          `${sidebarHidden ? 'grid-cols-1' : 'grid-cols-(--grid-cols-main)'}`,
        )
      "
    >
      <slot />
      <div v-if="hasSidebar" v-auto-animate class="flex flex-col gap-4">
        <div
          v-if="sidebarVisible"
          :class="
            cn(
              sidebarVisible && sidebarToggled
                ? 'absolute top-8 right-8 z-50 w-[360px] shadow-lg'
                : '',
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
