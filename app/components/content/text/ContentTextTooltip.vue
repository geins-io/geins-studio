<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    triggerClass?: string;
  }>(),
  {
    triggerClass: '',
  },
);
</script>
<template>
  <TooltipProvider :delay-duration="100">
    <Tooltip>
      <TooltipTrigger class="cursor-default">
        <span
          :class="
            cn(
              'tooltip-text',
              props.triggerClass,
            )
          "
        >
          <slot />
        </span>
      </TooltipTrigger>
      <TooltipContent class="max-w-96">
        <slot name="tooltip" />
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
