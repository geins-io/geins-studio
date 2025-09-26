<script setup lang="ts">
import {
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
} from '@/components/ui/sidebar/utils';

const viewport = useViewport();

// Use Nuxt's cookie for persistence
const sidebarOpen = useCookie<boolean>(SIDEBAR_COOKIE_NAME, {
  default: () => true,
  maxAge: SIDEBAR_COOKIE_MAX_AGE,
});

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

const isNarrow = computed(() => {
  const lessThanLg = viewport.isLessThan('xl');
  const lessThanMd = viewport.isLessThan('md');
  return (
    (sidebarOpen.value === true && lessThanLg) ||
    (sidebarOpen.value === false && lessThanMd)
  );
});

const gridColsClass = computed(() => {
  if (isNarrow.value) {
    return 'grid-cols-1 gap-3 [&>*]:col-span-1';
  }
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
  <div :class="`grid gap-x-6 ${gridColsClass}`">
    <slot />
  </div>
</template>
