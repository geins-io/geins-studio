<script lang="ts" setup>
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <p :class="cn('text-muted-foreground pl-1.5 text-xs', props.class)">
    <slot />
  </p>
</template>
