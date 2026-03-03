<script setup lang="ts">
import type { QuotationMessage } from '#shared/types';

const props = defineProps<{
  communications: QuotationMessage[];
}>();

const externalMessages = computed(() =>
  props.communications.filter(
    (m) => m.type === 'toCustomer' || m.type === 'fromCustomer',
  ),
);

const internalMessages = computed(() =>
  props.communications.filter(
    (m) => m.type === 'internal' || m.type === 'quotationNote',
  ),
);
</script>

<template>
  <Tabs default-value="external" class="w-full">
    <TabsList>
      <TabsTrigger value="external">
        {{ $t('orders.external_messages') }}
      </TabsTrigger>
      <TabsTrigger value="internal">
        {{ $t('orders.internal_messages') }}
      </TabsTrigger>
    </TabsList>
    <TabsContent value="external" class="mt-4">
      <QuotationMessageThread :messages="externalMessages" />
    </TabsContent>
    <TabsContent value="internal" class="mt-4">
      <QuotationMessageThread :messages="internalMessages" />
    </TabsContent>
  </Tabs>
</template>
