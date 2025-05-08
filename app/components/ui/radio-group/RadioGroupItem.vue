<script setup lang="ts">
import type { RadioGroupItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils';
import { RadioGroupIndicator, RadioGroupItem, useForwardProps } from 'reka-ui';
import { computed } from 'vue';

const props = defineProps<
  RadioGroupItemProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        'aspect-square size-5 rounded-full border border-border bg-card text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-foreground data-[state=checked]:dark:border-foreground',
        props.class,
      )
    "
  >
    <RadioGroupIndicator class="flex items-center justify-center">
      <div class="size-3 rounded-full bg-primary dark:bg-foreground" />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
