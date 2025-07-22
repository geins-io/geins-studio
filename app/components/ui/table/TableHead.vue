<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <th
    :class="
      cn(
        'border-l p-0 font-semibold first:rounded-tl-lg first:border-0 last:rounded-tr-lg',
        props.class,
      )
    "
  >
    <slot />
  </th>
</template>
