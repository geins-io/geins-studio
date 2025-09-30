<script setup lang="ts">
import {
  LucideChevronRight,
  LucideTag,
  LucideShapes,
  LucideSwatchBook,
  LucideCircleDollarSign,
  LucidePackage,
  LucideImport,
  LucideCopyCheck,
} from '#components';

const props = withDefaults(
  defineProps<{
    id: SelectorSelectionOptionsId;
    current: boolean;
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
      return LucideCopyCheck;
  }
});
</script>

<template>
  <li class="max-md:block max-md:flex-shrink-0">
    <button
      :class="
        cn(
          'hover:bg-background flex items-center gap-2.5 px-4 py-3 text-xs transition-colors max-md:rounded-t-lg max-md:px-5 max-md:pr-8 md:-mx-4 md:w-[calc(100%+2rem)] md:text-sm',
          {
            'md:bg-background max-md:border max-md:border-b-0': props.current,
            'max-md:bg-background max-md:border-b': !props.current,
          },
        )
      "
      @click="$emit('click')"
    >
      <component :is="icon" class="size-3.5 md:size-4" />
      <slot />
      <LucideChevronRight class="ml-auto size-3.5 max-md:hidden md:size-4" />
    </button>
  </li>
</template>
