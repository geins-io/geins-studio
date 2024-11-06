<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <thead :class="cn('[&_tr]:border-none', props.class)">
    <slot />
  </thead>
</template>
