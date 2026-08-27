<script lang="ts" setup>
import { reactiveOmit } from "@vueuse/core"
import { StepperIndicator, useForwardProps } from "reka-ui"
import { cn } from '@/utils/index'
import type { StepperIndicatorProps } from "reka-ui"
import type { HTMLAttributes } from "vue"

const props = defineProps<StepperIndicatorProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <StepperIndicator
    v-slot="slotProps"
    v-bind="forwarded"
    :class="cn(
      // Unreached steps still get a filled (muted) circle
      'inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium w-7 h-7',
      // Disabled
      'group-data-[disabled]:opacity-50',
      // Active
      'group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground',
      // Completed — filled like active, matching the wizard's done+current steps
      'group-data-[state=completed]:bg-primary group-data-[state=completed]:text-primary-foreground',
      props.class,
    )"
  >
    <slot v-bind="slotProps" />
  </StepperIndicator>
</template>
