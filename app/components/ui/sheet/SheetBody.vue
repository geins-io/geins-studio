<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <div :class="cn('flex w-full grow flex-col pt-6', props.class)">
    <slot />
  </div>
</template>
