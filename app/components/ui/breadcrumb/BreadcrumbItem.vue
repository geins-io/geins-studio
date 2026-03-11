<script lang="ts" setup>
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <li
    data-slot="breadcrumb-item"
    :class="
      cn('inline-flex items-center gap-1.5 text-xs sm:text-sm', props.class)
    "
  >
    <slot />
  </li>
</template>
