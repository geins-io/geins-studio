<script setup lang="ts">
import type { QuotationMessage } from '#shared/types';

defineProps<{
  messages: QuotationMessage[];
}>();

const { formatDate } = useDate();
</script>

<template>
  <div v-if="messages.length === 0" class="text-muted-foreground py-8 text-center text-sm">
    {{ $t('orders.no_messages') }}
  </div>
  <div v-else class="space-y-4">
    <div
      v-for="(msg, index) in messages"
      :key="index"
      class="rounded-lg border p-4"
    >
      <div class="mb-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">{{ msg.author }}</span>
          <Badge
            v-if="msg.type === 'toCustomer'"
            variant="outline"
            class="text-xs"
          >
            {{ $t('orders.external_messages') }}
          </Badge>
          <Badge
            v-else-if="msg.type === 'fromCustomer'"
            variant="secondary"
            class="text-xs"
          >
            {{ $t('customer') }}
          </Badge>
          <Badge
            v-else-if="msg.type === 'quotationNote'"
            variant="secondary"
            class="text-xs"
          >
            {{ $t('orders.notes') }}
          </Badge>
        </div>
        <span class="text-muted-foreground text-xs">
          {{ msg.timestamp ? formatDate(msg.timestamp) : '' }}
        </span>
      </div>
      <p class="text-sm whitespace-pre-wrap">{{ msg.message }}</p>
    </div>
  </div>
</template>
