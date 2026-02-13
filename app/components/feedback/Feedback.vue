<script setup lang="ts">
import {
  LucideCheckCircle2,
  LucideTriangleAlert,
  LucideCircleAlert,
  LucideInfo,
} from '#components';

const props = withDefaults(
  defineProps<{
    type?: 'positive' | 'negative' | 'warning' | 'info';
  }>(),
  {
    type: 'info',
  },
);

const variant = computed(() => {
  switch (props.type) {
    case 'positive':
      return 'positive';
    case 'negative':
      return 'destructive';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'info';
  }
});

const icon = computed(() => {
  switch (props.type) {
    case 'positive':
      return LucideCheckCircle2;
    case 'negative':
      return LucideTriangleAlert;
    case 'warning':
      return LucideCircleAlert;
    case 'info':
    default:
      return LucideInfo;
  }
});
</script>
<template>
  <Alert :variant="variant">
    <component :is="icon" class="-mt-1 -ml-1 size-5" />
    <AlertTitle>
      <slot name="title" />
    </AlertTitle>
    <AlertDescription>
      <slot name="description" />
    </AlertDescription>
    <div v-if="$slots.actions" class="mt-2">
      <slot name="actions" />
    </div>
  </Alert>
</template>
