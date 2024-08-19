<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { Primitive, type PrimitiveProps } from 'radix-vue';
import { type ButtonVariants, buttonVariants } from '.';
import { cn } from '@/lib/utils';
import { ReloadIcon } from '@radix-icons/vue';

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  class?: HTMLAttributes['class'];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
});
</script>

<template>
  <Primitive
    :disabled="loading"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <ReloadIcon v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
    <slot />
  </Primitive>
</template>
