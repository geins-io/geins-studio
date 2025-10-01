<script setup lang="ts">
import { SelectGroup, type SelectGroupProps } from 'reka-ui';
import { type HTMLAttributes } from 'vue';

const props = defineProps<
  SelectGroupProps & { class?: HTMLAttributes['class'] }
>();
</script>

<template>
  <SelectGroup
    data-slot="select-group"
    v-bind="props"
    :class="cn('w-full p-1', props.class)"
  >
    <slot />
  </SelectGroup>
</template>
