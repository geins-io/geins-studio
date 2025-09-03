<script setup lang="ts">
const _props = defineProps<{
  className?: string;
  manual: boolean;
}>();
</script>
<template>
  <div :class="cn(className, 'px-1.5')">
    <TooltipProvider :delay-duration="100">
      <Tooltip>
        <TooltipTrigger class="w-full cursor-default p-0! text-center">
          <span
            v-if="manual"
            class="text-warning w-full text-center text-[10px]"
          >
            M
          </span>
          <span
            v-else
            class="text-muted-foreground w-full text-center text-[10px]"
          >
            A
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {{ manual ? 'Price changed manually' : 'Price set automatically' }}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>
