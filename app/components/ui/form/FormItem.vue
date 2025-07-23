<script lang="ts" setup>
import { useId } from 'reka-ui';
import { type HTMLAttributes, provide } from 'vue';
import { cn } from '@/lib/utils';
import { FORM_ITEM_INJECTION_KEY } from './injectionKeys';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const id = useId();
provide(FORM_ITEM_INJECTION_KEY, id);
</script>

<template>
  <div
    v-auto-animate
    data-slot="form-item"
    :class="cn('grid gap-1', props.class)"
  >
    <slot />
  </div>
</template>
