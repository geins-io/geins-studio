<script setup lang="ts">
import type { Price } from '#shared/types';
const props = defineProps<Price>();
const currency = toRef(props, 'currency');
const price = toRef(props, 'price');
const { formatCurrency } = usePrice();
const displayPrice = computed(() => {
  if (!price.value || price.value === '---') return price.value;
  return formatCurrency(price.value);
});
</script>
<template>
  <div>
    <div class="flex items-center">
      <span :class="cn('text-muted-foreground mr-2 border-r pr-2 text-xs')">
        {{ currency }}
      </span>
      <span
        :class="
          cn(
            'size-full rounded-lg bg-transparent text-xs',
            price === '---' ? 'text-muted-foreground' : '',
          )
        "
      >
        {{ displayPrice }}
      </span>
    </div>
  </div>
</template>
