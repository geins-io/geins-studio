<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <div :class="cn('mt-auto flex justify-between border-t p-4', props.class)">
    <slot />
  </div>
</template>
