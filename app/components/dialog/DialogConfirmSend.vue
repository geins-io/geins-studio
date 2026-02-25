<script setup lang="ts">
const props = defineProps<{
  entityName: string;
  loading: boolean;
}>();
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
          $t('orders.send_quotation_title')
        }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ $t('orders.send_quotation_warning') }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div class="space-y-2">
        <Label>
          {{ $t('orders.message_to_customer') }}
        </Label>
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
        <ButtonIcon
          icon="send"
          :loading="props.loading"
          @click.prevent.stop="handleConfirm"
        >
          {{ $t('send_entity', { entityName: props.entityName }) }}
        </ButtonIcon>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
