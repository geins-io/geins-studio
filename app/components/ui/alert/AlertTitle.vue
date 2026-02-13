<script setup lang="ts">
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div data-slot="alert-title" :class="cn('mb-1 font-semibold', props.class)">
    <slot />
  </div>
</template>
