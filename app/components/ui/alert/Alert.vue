<script setup lang="ts">
import { cn } from '@/utils/index';
import { type AlertVariants, alertVariants } from '.';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
  variant?: AlertVariants['variant'];
}>();
</script>

<template>
  <div
    data-slot="alert"
    :class="cn(alertVariants({ variant }), props.class)"
    role="alert"
  >
    <slot />
  </div>
</template>
