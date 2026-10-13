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
  <!-- `size="xs"`: our Button's default size adds `sm:h-9 sm:px-4`, which the
       input-group size classes can't override, so the button outgrew the group. -->
  <Button
    :data-size="props.size"
    :variant="props.variant"
    size="xs"
    :class="cn(inputGroupButtonVariants({ size: props.size }), props.class)"
  >
    <slot />
  </Button>
</template>
