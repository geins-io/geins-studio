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
      return 'grid-cols-12 [&>*:nth-child(1)]:col-span-3 [&>*:nth-child(2)]:col-span-3 [&>*:nth-child(3)]:col-span-6';
    case '2+1+1':
      return 'grid-cols-12 [&>*:nth-child(1)]:col-span-6 [&>*:nth-child(2)]:col-span-3 [&>*:nth-child(3)]:col-span-3';
    case '2+2':
      return 'grid-cols-12 [&>*:nth-child(1)]:col-span-6 [&>*:nth-child(2)]:col-span-6';
    case '1+1+1+1':
      return 'grid-cols-12 [&>*:nth-child(1)]:col-span-3 [&>*:nth-child(2)]:col-span-3 [&>*:nth-child(3)]:col-span-3 [&>*:nth-child(4)]:col-span-3';
    case '1+1+1':
      return 'grid-cols-12 [&>*:nth-child(1)]:col-span-4 [&>*:nth-child(2)]:col-span-4 [&>*:nth-child(3)]:col-span-4';
    case '1+2':
      return 'grid-cols-12 [&>*:nth-child(1)]:col-span-4 [&>*:nth-child(2)]:col-span-8';
    case '2+1':
      return 'grid-cols-12 [&>*:nth-child(1)]:col-span-8 [&>*:nth-child(2)]:col-span-4';
    case '1+1':
      return 'grid-cols-12 [&>*:nth-child(1)]:col-span-6 [&>*:nth-child(2)]:col-span-6';
    default:
      return 'grid-cols-12 [&>*]:col-span-12';
  }
});
</script>

<template>
  <div
    :class="
      cn(
        'grid',
        gridColsClass,
        'gap-x-4 @3xl/form-grid:gap-x-6',
        '@max-xl/form-grid:grid-cols-1 @max-xl/form-grid:gap-3 @max-xl/form-grid:[&>*]:col-span-1',
      )
    "
  >
    <slot />
  </div>
</template>
