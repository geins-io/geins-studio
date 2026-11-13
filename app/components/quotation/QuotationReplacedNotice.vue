<script setup lang="ts">
import type { QuotationVersionRef } from '#shared/types';
import { entityEditUrl } from '#shared/utils/entities';

withDefaults(
  defineProps<{
    /** The version shown */
    quotationNumber: string;
    /** The version that replaces it: the chain's live version */
    replacedBy: QuotationVersionRef;
    /** The version shown is the buyer's request, answered by an offer */
    request?: boolean;
  }>(),
  {
    request: false,
  },
);
</script>

<template>
  <Item variant="outline" class="bg-card">
    <ItemMedia variant="icon">
      <LucideHistory class="text-muted-foreground" />
    </ItemMedia>
    <ItemContent>
      <ItemTitle>
        {{
          request
            ? $t('orders.replaced_request')
            : $t('orders.replaced_version', { number: quotationNumber })
        }}
      </ItemTitle>
      <ItemDescription>
        {{ $t('orders.replaced_by', { number: replacedBy.quotationNumber }) }}
      </ItemDescription>
    </ItemContent>
    <ItemActions>
      <Button variant="secondary" size="sm" as-child>
        <NuxtLink :to="entityEditUrl('quotation', replacedBy.quotationId)">
          {{ $t('orders.view_latest_version') }}
        </NuxtLink>
      </Button>
    </ItemActions>
  </Item>
</template>
