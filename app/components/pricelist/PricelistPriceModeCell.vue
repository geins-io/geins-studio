<script setup lang="ts">
const props = defineProps<{
  className?: string;
  priceMode: PricelistPriceMode;
}>();

const tooltipContent = computed(() => {
  switch (props.priceMode) {
    case 'fixed':
    case 'margin':
    case 'discount':
      return 'Price changed manually';
    case 'rule':
      return 'Price set globally';
    case 'auto':
      return 'Default price';
    default:
      return 'Default price';
  }
});

const displayLetter = computed(() => {
  switch (props.priceMode) {
    case 'fixed':
    case 'margin':
    case 'discount':
      return 'M';
    case 'rule':
      return 'G';
    default:
      return 'D';
  }
});
</script>
<template>
  <div :class="cn(className, 'px-1.5')">
    <TooltipProvider :delay-duration="100">
      <Tooltip>
        <TooltipTrigger class="w-full cursor-default p-0! text-center">
          <span
            :class="
              cn(
                'text-muted-foreground w-full text-center text-[10px]',
                displayLetter === 'M' && 'text-warning',
                displayLetter === 'G' && 'text-blue-900',
              )
            "
          >
            {{ displayLetter }}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {{ tooltipContent }}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>
