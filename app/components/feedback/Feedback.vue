<script setup lang="ts">
import {
  CheckCircle2,
  Info,
  TriangleAlert,
  CircleAlert,
} from 'lucide-vue-next';
const props = withDefaults(
  defineProps<{
    type: 'positive' | 'negative' | 'warning' | 'info';
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
      return CheckCircle2;
    case 'negative':
      return TriangleAlert;
    case 'warning':
      return CircleAlert;
    case 'info':
    default:
      return Info;
  }
});
</script>
<template>
  <Alert :variant="variant">
    <component :is="icon" class="-ml-1 -mt-1 size-5" />
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
