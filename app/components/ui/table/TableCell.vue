<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <td :class="cn('border-l p-0 [&:first-child]:border-0', props.class)">
    <slot />
  </td>
</template>
