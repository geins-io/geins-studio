<script setup lang="ts"></script>
<template>
  <TooltipProvider :delay-duration="100">
    <Tooltip>
      <TooltipTrigger>
        <span
          class="underline decoration-muted-foreground decoration-dashed decoration-1 underline-offset-4"
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
