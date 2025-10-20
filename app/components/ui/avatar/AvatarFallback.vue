<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { AvatarFallback, type AvatarFallbackProps } from 'reka-ui';
import { cn } from '@/utils/index';

const props = defineProps<
  AvatarFallbackProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <AvatarFallback
    data-slot="avatar-fallback"
    v-bind="delegatedProps"
    :class="
      cn(
        'bg-background flex size-full items-center justify-center border text-xs',
        props.class,
      )
    "
  >
    <slot />
  </AvatarFallback>
</template>
