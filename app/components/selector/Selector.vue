<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    mode: 'simple' | 'advanced';
  }>(),
  {
    mode: 'simple',
  },
);

const searchString = ref('');
</script>
<template>
  <div class="flex justify-between">
    <slot name="header">
      <SelectorHeader title="Product selection" />
    </slot>
    <slot name="search">
      <div class="relative flex w-1/3">
        <Input v-model="searchString" class="" placeholder="Quick search.." />
        <span
          class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
        >
          <LucideSearch class="size-4 text-foreground" />
        </span>
      </div>
    </slot>
  </div>
  <div>
    <slot name="selection" />
    <slot />
    <slot name="list" />
  </div>
</template>
