<script setup lang="ts">
const props = defineProps<{
  className?: string;
  priceMode: PriceListPriceMode;
}>();

const tooltipContent = computed(() => {
  switch (props.priceMode) {
    case 'fixed':
    case 'margin':
    case 'discount':
      return 'Price set manually';
    case 'rule':
    case 'autoRule':
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
    case 'autoRule':
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
        <TooltipTrigger class="p-0! w-full cursor-default text-center">
          <span
            :class="
              cn(
                'text-muted-foreground decoration-muted-foreground underline-offset-3 w-full text-center text-[10px] underline decoration-dashed',
                displayLetter === 'M' && 'text-warning decoration-warning',
                displayLetter === 'G' &&
                  'text-blue-900 decoration-blue-900 dark:text-blue-200 dark:decoration-blue-200',
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
