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
              'decoration-muted-foreground underline decoration-dashed decoration-1 underline-offset-4',
              props.triggerClass,
            )
          "
        >
          <slot />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <slot name="tooltip" />
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
