<script setup lang="ts">
const { t } = useI18n();

const props = defineProps<{
  className?: string;
  priceMode: PriceListPriceMode;
}>();

const tooltipContent = computed(() => {
  switch (props.priceMode) {
    case 'fixed':
    case 'margin':
    case 'discount':
      return t('pricing.price_set_manually');
    case 'rule':
    case 'autoRule':
      return t('pricing.price_set_globally');
    case 'auto':
      return t('pricing.default_price');
    default:
      return t('pricing.default_price');
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
        <TooltipTrigger class="w-full cursor-default p-0! text-center">
          <span
            :class="
              cn(
                'text-muted-foreground decoration-muted-foreground w-full text-center text-[10px] underline decoration-dashed underline-offset-3',
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
