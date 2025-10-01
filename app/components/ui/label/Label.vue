<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { Label, type LabelProps } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <Label
    data-slot="label"
    v-bind="delegatedProps"
    :class="
      cn(
        'inline-block text-sm leading-none font-semibold select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        props.class,
      )
    "
  >
    <slot />
  </Label>
</template>
