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
  <li>
    <button
      :class="
        cn(
          '-mx-2 flex w-[calc(100%+1rem)] items-center gap-2.5 px-3 py-3 text-sm transition-colors hover:bg-background',
          {
            'bg-background': props.current,
          },
        )
      "
      @click="$emit('click')"
    >
      <component :is="icon" class="size-4" />
      <slot />
      <LucideChevronRight class="ml-auto size-4" />
    </button>
  </li>
</template>
