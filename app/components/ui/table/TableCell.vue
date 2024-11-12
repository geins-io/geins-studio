<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <td :class="cn('[&:not(:last-child)]:border-r', props.class)">
    <slot />
  </td>
</template>
