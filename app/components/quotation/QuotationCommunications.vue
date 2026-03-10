<script setup lang="ts">
import type { QuotationMessage, QuotationMessageType } from '#shared/types';

const props = withDefaults(
  defineProps<{
    communications: QuotationMessage[];
    currentUserEmail?: string;
    loading?: boolean;
    editLoading?: boolean;
    messageSendSuccessCount?: number;
  }>(),
  {
    currentUserEmail: '',
    loading: false,
    editLoading: false,
    messageSendSuccessCount: 0,
  },
);

const emit = defineEmits<{
  sendMessage: [
    type: QuotationMessageType,
    message: string,
    answerRef?: string,
  ];
  editMessage: [messageId: string, newText: string];
  deleteMessage: [messageId: string];
}>();

const externalReplyTo = ref<QuotationMessage | null>(null);
const internalReplyTo = ref<QuotationMessage | null>(null);
const externalClearTrigger = ref(0);
const internalClearTrigger = ref(0);
type PendingSendTab = 'external' | 'internal' | null;
const pendingSendTab = ref<PendingSendTab>(null);

watch(
  () => props.messageSendSuccessCount,
  () => {
    if (pendingSendTab.value === 'external') {
      externalClearTrigger.value++;
    } else if (pendingSendTab.value === 'internal') {
      internalClearTrigger.value++;
    }
    pendingSendTab.value = null;
  },
);

const externalMessages = computed(() =>
  props.communications.filter(
    (m) => m.type === 'toCustomer' || m.type === 'fromCustomer',
  ),
);

const internalMessages = computed(() =>
  props.communications.filter((m) => m.type === 'internal'),
);

const handleExternalSend = (message: string) => {
  pendingSendTab.value = 'external';
  emit('sendMessage', 'toCustomer', message, externalReplyTo.value?._id);
};

const handleInternalSend = (message: string) => {
  pendingSendTab.value = 'internal';
  emit('sendMessage', 'internal', message, internalReplyTo.value?._id);
};
</script>

<template>
  <Tabs default-value="external" class="w-full">
    <TabsList>
      <TabsTrigger value="external">
        {{ $t('orders.external_messages') }}
        <Badge
          v-if="externalMessages.length"
          variant="secondary"
          class="ml-0.5 size-4 text-[10px]"
        >
          {{ externalMessages.length }}
        </Badge>
      </TabsTrigger>
      <TabsTrigger value="internal">
        {{ $t('orders.internal_messages') }}
        <Badge
          v-if="internalMessages.length"
          variant="secondary"
          class="ml-0.5 size-4 text-[10px]"
        >
          {{ internalMessages.length }}
        </Badge>
      </TabsTrigger>
    </TabsList>
    <TabsContent value="external" class="mt-4 border-t pt-4">
      <QuotationMessageThread
        mode="external"
        :messages="externalMessages"
        :all-communications="communications"
        :current-user-email="currentUserEmail"
        :edit-loading="editLoading"
        @reply="(msg) => (externalReplyTo = msg)"
        @edit="(id, text) => emit('editMessage', id, text)"
        @delete="(id) => emit('deleteMessage', id)"
      />
      <QuotationMessageCompose
        class="mt-4"
        message-type="toCustomer"
        :loading="loading"
        :reply-to="externalReplyTo"
        :clear-trigger="externalClearTrigger"
        @send="handleExternalSend"
        @cancel-reply="externalReplyTo = null"
      />
    </TabsContent>
    <TabsContent value="internal" class="mt-4 border-t pt-4">
      <QuotationMessageThread
        :messages="internalMessages"
        :all-communications="communications"
        :current-user-email="currentUserEmail"
        :edit-loading="editLoading"
        @reply="(msg) => (internalReplyTo = msg)"
        @edit="(id, text) => emit('editMessage', id, text)"
        @delete="(id) => emit('deleteMessage', id)"
      />
      <QuotationMessageCompose
        class="mt-4"
        message-type="internal"
        :loading="loading"
        :reply-to="internalReplyTo"
        :clear-trigger="internalClearTrigger"
        @send="handleInternalSend"
        @cancel-reply="internalReplyTo = null"
      />
    </TabsContent>
  </Tabs>
</template>
