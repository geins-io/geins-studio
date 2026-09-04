<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core"
import {
  ProgressIndicator,
  ProgressRoot,
} from "reka-ui"
import { cn } from '@/utils/index'
import type { ProgressRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"

const props = withDefaults(
  defineProps<ProgressRootProps & {
    class?: HTMLAttributes["class"]
    // Recolor the fill per instance (storage segments) without a wrapper.
    indicatorClass?: HTMLAttributes["class"]
  }>(),
  {
    modelValue: 0,
  },
)

const delegatedProps = reactiveOmit(props, "class", "indicatorClass")
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    v-bind="delegatedProps"
    :class="
      cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        props.class,
      )
    "
  >
    <ProgressIndicator
      data-slot="progress-indicator"
      :class="cn('bg-primary h-full w-full flex-1 transition-all', props.indicatorClass)"
      :style="`transform: translateX(-${100 - (props.modelValue ?? 0)}%);`"
    />
  </ProgressRoot>
</template>
