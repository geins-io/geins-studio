<script lang="ts" setup>
import { cn } from '@/utils/index';
import { useFormField } from './useFormField';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const { formDescriptionId } = useFormField();
</script>

<template>
  <p
    :id="formDescriptionId"
    data-slot="form-description"
    :class="cn('text-muted-foreground pl-1.5 text-xs', props.class)"
  >
    <slot />
  </p>
</template>
