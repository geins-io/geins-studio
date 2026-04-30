<script setup lang="ts">
import KeyboardShortcut from './KeyboardShortcut.vue'

defineProps<{
  label: string
  keys: string
}>()
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <Tooltip>
      <!-- `as-child` hands the trigger role to the slotted element so we don't
           nest a button inside a button (VueFlow's ControlButton is already a
           <button>). -->
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipContent class="flex items-center gap-2">
        <p class="text-xs">{{ label }}</p>
        <KeyboardShortcut :keys="keys" />
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
