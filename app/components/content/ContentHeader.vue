<script setup lang="ts">
const _props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    entityName?: string;
  }>(),
  {
    title: '',
    description: '',
    entityName: '',
  },
);

const tableMaximized = useState<boolean>('table-maximized');
// TODO: Dynamic breadcrumbs

const slots = useSlots();
const hasTabs = computed(() => !!slots.tabs);
const hasChanges = computed(() => !!slots.changes);
</script>

<template>
  <div
    :class="
      cn(
        'origin-top transform transition-transform',
        `${tableMaximized ? 'scale-y-0' : ''}`,
      )
    "
  >
    <div
      :class="
        cn(
          'content-header mb-4 flex flex-wrap justify-between border-b',
          `${hasTabs || hasChanges ? 'pb-0' : 'pb-2'}`,
        )
      "
    >
      <slot name="title">
        <ContentTitleBlock :title="title" :description="description" />
      </slot>
      <slot />
      <div
        v-if="hasTabs || hasChanges"
        v-auto-animate
        class="mt-2 flex w-full justify-between sm:mt-5"
      >
        <slot name="tabs" />
        <slot name="changes" />
      </div>
    </div>
  </div>
</template>
