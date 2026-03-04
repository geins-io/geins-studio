<script setup lang="ts">
import type { QuotationMessageType, QuotationMessage } from '#shared/types';

const props = withDefaults(
  defineProps<{
    messageType: QuotationMessageType;
    loading?: boolean;
    replyTo?: QuotationMessage | null;
    clearTrigger?: number;
  }>(),
  {
    loading: false,
    replyTo: null,
    clearTrigger: 0,
  },
);

const emit = defineEmits<{
  send: [message: string];
  cancelReply: [];
}>();

const { t } = useI18n();
const messageText = ref('');

const placeholder = computed(() =>
  props.messageType === 'toCustomer' || props.messageType === 'fromCustomer'
    ? t('orders.message_to_customer_compose_placeholder')
    : t('orders.internal_note_compose_placeholder'),
);

const canSend = computed(
  () => messageText.value.trim().length > 0 && !props.loading,
);

const pendingSend = ref(false);

watch(
  () => props.clearTrigger,
  () => {
    if (pendingSend.value) {
      messageText.value = '';
      pendingSend.value = false;
      emit('cancelReply');
    }
  },
);

const handleSend = () => {
  if (!canSend.value) return;
  pendingSend.value = true;
  emit('send', messageText.value.trim());
};
</script>

<template>
  <div class="space-y-2 border-t pt-4">
    <div
      v-if="replyTo"
      class="text-muted-foreground flex items-center gap-2 text-xs"
    >
      <LucideCornerDownRight class="size-3" />
      <span>{{
        t('orders.replying_to', { author: replyTo.authorName })
      }}</span>
      <button class="hover:text-foreground" @click="emit('cancelReply')">
        <LucideX class="size-3" />
      </button>
    </div>
    <Textarea
      v-model="messageText"
      :placeholder="placeholder"
      rows="4"
      class="p-2"
    />
    <div class="flex justify-end">
      <Button size="sm" :loading="loading" :disabled="!canSend" @click="handleSend">
        <LucideSend class="mr-2 size-4" />
        {{ t('send') }}
      </Button>
    </div>
  </div>
</template>
