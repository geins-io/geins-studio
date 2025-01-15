<script setup lang="ts">
import {
  LucideChevronRight,
  LucideTag,
  LucideShapes,
  LucideSwatchBook,
  LucideCircleDollarSign,
  LucidePackage,
  LucideImport,
} from '#components';

const props = withDefaults(
  defineProps<{
    id: 'product' | 'category' | 'brand' | 'price' | 'stock' | 'import';
  }>(),
  {},
);

const _emits = defineEmits(['click']);

const icon = computed(() => {
  switch (props.id) {
    case 'product':
      return LucideTag;
    case 'category':
      return LucideShapes;
    case 'brand':
      return LucideSwatchBook;
    case 'price':
      return LucideCircleDollarSign;
    case 'stock':
      return LucidePackage;
    case 'import':
      return LucideImport;
    default:
      return LucideChevronRight;
  }
});
</script>

<template>
  <li>
    <button
      class="flex w-full items-center gap-2.5 px-1 py-3.5 text-sm"
      @click="$emit('click', props.id)"
    >
      <component :is="icon" class="size-4" />
      <slot />
      <LucideChevronRight class="ml-auto size-4" />
    </button>
  </li>
</template>
