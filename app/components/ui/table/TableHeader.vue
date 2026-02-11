<script setup lang="ts">
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <thead
    data-slot="table-header"
    :class="cn('[&_tr]:border-none', props.class)"
  >
    <slot />
  </thead>
</template>
