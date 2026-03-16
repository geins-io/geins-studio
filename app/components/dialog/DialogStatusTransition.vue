<script setup lang="ts">
import { getLocalTimeZone, today } from '@internationalized/date';
import type { QuotationMessageType } from '#shared/types';

type TransitionIcon =
  | 'send'
  | 'check'
  | 'x'
  | 'ban'
  | 'shopping-cart'
  | 'calendar-plus';

const props = withDefaults(
  defineProps<{
    action: string;
    title: string;
    description: string;
    loading: boolean;
    showMessage?: boolean;
    showDatePicker?: boolean;
    datePickerLabel?: string;
    defaultMessageType?: QuotationMessageType;
    variant?: 'default' | 'destructive';
    icon?: TransitionIcon;
    blockReasons?: string[];
  }>(),
  {
    showMessage: true,
    showDatePicker: false,
    datePickerLabel: undefined,
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
  confirm: [
    message: string | undefined,
    messageType: QuotationMessageType,
    validTo?: string,
  ];
  cancel: [];
}>();

const message = ref('');
const selectedDate = ref<string>();
const selectedMessageType = ref<QuotationMessageType>(props.defaultMessageType);

const isBlocked = computed(
  () => props.blockReasons && props.blockReasons.length > 0,
);

const isDateRequired = computed(
  () => props.showDatePicker && !selectedDate.value,
);

const handleConfirm = () => {
  emit(
    'confirm',
    message.value || undefined,
    selectedMessageType.value,
    selectedDate.value,
  );
};

// Reset state when dialog opens/closes
watch(open, (isOpen) => {
  if (!isOpen) {
    message.value = '';
    selectedDate.value = undefined;
  } else {
    selectedMessageType.value = props.defaultMessageType;
  }
});
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ props.title }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ props.description }}
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
      <div v-if="props.showDatePicker && !isBlocked" class="space-y-1.5">
        <Label>
          {{ props.datePickerLabel || $t('expiration_date') }}
        </Label>
        <FormInputDate
          v-model="selectedDate"
          :placeholder="props.datePickerLabel || $t('expiration_date')"
          :min-value="today(getLocalTimeZone())"
        />
      </div>
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
          :disabled="isBlocked || isDateRequired"
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
          <LucideCalendarPlus
            v-if="props.icon === 'calendar-plus'"
            class="mr-2 size-4"
          />
          {{ props.action }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
