<script setup lang="ts">
import type { QuotationMessageType } from '#shared/types';

type TransitionIcon = 'send' | 'check' | 'x' | 'ban' | 'shopping-cart';

const props = withDefaults(
  defineProps<{
    action: string;
    entityName: string;
    loading: boolean;
    showMessage?: boolean;
    defaultMessageType?: QuotationMessageType;
    variant?: 'default' | 'destructive';
    icon?: TransitionIcon;
    blockReasons?: string[];
  }>(),
  {
    showMessage: true,
    defaultMessageType: 'internal',
    variant: 'default',
    icon: undefined,
    blockReasons: undefined,
  },
);
const open = defineModel('open', {
  type: Boolean,
  default: false,
});
const emit = defineEmits<{
  confirm: [message: string | undefined, messageType: QuotationMessageType];
  cancel: [];
}>();

const message = ref('');
const selectedMessageType = ref<QuotationMessageType>(props.defaultMessageType);

const isBlocked = computed(
  () => props.blockReasons && props.blockReasons.length > 0,
);

const handleConfirm = () => {
  emit('confirm', message.value || undefined, selectedMessageType.value);
};

// Reset state when dialog opens/closes
watch(open, (isOpen) => {
  if (!isOpen) {
    message.value = '';
  } else {
    selectedMessageType.value = props.defaultMessageType;
  }
});
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{
          $t('orders.status_transition_title', { action: props.action })
        }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{
            $t('orders.status_transition_description', {
              action: props.action.toLowerCase(),
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <Feedback v-if="isBlocked" type="warning">
        <template #title>
          {{ $t('orders.send_blocked_title') }}
        </template>
        <template #description>
          <ul class="mt-1 list-inside list-disc space-y-0.5 text-xs">
            <li v-for="reason in blockReasons" :key="reason">
              {{ reason }}
            </li>
          </ul>
        </template>
      </Feedback>
      <div v-if="props.showMessage && !isBlocked" class="space-y-3">
        <Tabs v-model="selectedMessageType">
          <TabsList>
            <TabsTrigger value="toCustomer">
              {{ $t('orders.message_to_customer') }}
            </TabsTrigger>
            <TabsTrigger value="internal">
              {{ $t('orders.internal_note') }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Textarea
          v-model="message"
          :placeholder="
            selectedMessageType === 'toCustomer'
              ? $t('orders.message_to_customer_placeholder')
              : $t('orders.internal_note_placeholder')
          "
          rows="3"
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel @click="$emit('cancel')">{{
          $t('cancel')
        }}</AlertDialogCancel>
        <Button
          :loading="props.loading"
          :variant="props.variant"
          :disabled="isBlocked"
          @click.prevent.stop="handleConfirm"
        >
          <LucideSend v-if="props.icon === 'send'" class="mr-2 size-4" />
          <LucideCheck v-if="props.icon === 'check'" class="mr-2 size-4" />
          <LucideX v-if="props.icon === 'x'" class="mr-2 size-4" />
          <LucideBan v-if="props.icon === 'ban'" class="mr-2 size-4" />
          <LucideShoppingCart
            v-if="props.icon === 'shopping-cart'"
            class="mr-2 size-4"
          />
          {{ props.action }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
