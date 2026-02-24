<script setup lang="ts">
import type { QuotationMessageType } from '#shared/types';

const props = withDefaults(
  defineProps<{
    action: string;
    entityName: string;
    loading: boolean;
    showMessage?: boolean;
    messageType?: QuotationMessageType;
    variant?: 'default' | 'destructive';
  }>(),
  {
    showMessage: true,
    messageType: 'internal',
    variant: 'default',
  },
);
const open = defineModel('open', {
  type: Boolean,
  default: false,
});
const emit = defineEmits<{
  confirm: [message?: string];
  cancel: [];
}>();

const message = ref('');

const handleConfirm = () => {
  emit('confirm', message.value || undefined);
};

// Reset message when dialog closes
watch(open, (isOpen) => {
  if (!isOpen) {
    message.value = '';
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
      <div v-if="props.showMessage" class="space-y-2">
        <label class="text-sm font-medium">
          {{ $t('orders.message_to_customer') }}
        </label>
        <Textarea
          v-model="message"
          :placeholder="$t('orders.message_to_customer_placeholder')"
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
          @click.prevent.stop="handleConfirm"
        >
          {{ props.action }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
