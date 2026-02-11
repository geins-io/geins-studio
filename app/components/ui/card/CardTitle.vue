<script setup lang="ts">
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <h3
    data-slot="card-title"
    :class="cn('leading-none font-semibold tracking-tight', props.class)"
  >
    <slot />
  </h3>
</template>
