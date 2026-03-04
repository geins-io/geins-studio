<script setup lang="ts">
import type { ButtonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/index'
import { inputGroupButtonVariants } from "."
import type { InputGroupButtonVariants } from "."
import type { HTMLAttributes } from "vue"

interface InputGroupButtonProps {
  variant?: ButtonVariants["variant"]
  size?: InputGroupButtonVariants["size"]
  class?: HTMLAttributes["class"]
}

const props = withDefaults(defineProps<InputGroupButtonProps>(), {
  size: "xs",
  variant: "ghost",
})
</script>

<template>
  <Button
    :data-size="props.size"
    :variant="props.variant"
    :class="cn(inputGroupButtonVariants({ size: props.size }), props.class)"
  >
    <slot />
  </Button>
</template>
