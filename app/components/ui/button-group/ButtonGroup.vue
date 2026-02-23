<script setup lang="ts">
import { cn } from '@/utils/index'
import { buttonGroupVariants } from "."
import type { ButtonGroupVariants } from "."
import type { HTMLAttributes } from "vue"

const props = defineProps<{
  class?: HTMLAttributes["class"]
  orientation?: ButtonGroupVariants["orientation"]
}>()
</script>

<template>
  <div
    role="group"
    data-slot="button-group"
    :data-orientation="props.orientation"
    :class="cn(buttonGroupVariants({ orientation: props.orientation }), props.class)"
  >
    <slot />
  </div>
</template>
