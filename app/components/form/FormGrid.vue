<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    design:
      | '1+1+2'
      | '2+1+1'
      | '2+2'
      | '1+1+1+1'
      | '1+1+1'
      | '1+2'
      | '2+1'
      | '1+1'
      | '1';
  }>(),
  {
    design: '1+1+1',
  },
);

const gridColsClass = computed(() => {
  switch (props.design) {
    case '1+1+2':
      return 'grid-cols-[1fr_1fr_2fr]';
    case '2+1+1':
      return 'grid-cols-[2fr_1fr_1fr]';
    case '2+2':
      return 'grid-cols-[2fr_2fr]';
    case '1+1+1+1':
      return 'grid-cols-4';
    case '1+1+1':
      return 'grid-cols-3';
    case '1+2':
      return 'grid-cols-[1fr_2fr]';
    case '2+1':
      return 'grid-cols-[2fr_1fr]';
    case '1+1':
      return 'grid-cols-2';
    default:
      return 'grid-cols-1';
  }
});
</script>

<template>
  <div :class="`grid space-x-6 ${gridColsClass}`">
    <slot />
  </div>
</template>
