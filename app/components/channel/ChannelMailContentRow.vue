<script setup lang="ts">
import type { ChannelMailType, MailTypeId } from '#shared/types';

const props = defineProps<{
  mailType: ChannelMailType;
}>();

const emit = defineEmits<{
  edit: [mailType: ChannelMailType];
  'update:active': [payload: { _id: MailTypeId; active: boolean }];
}>();

const { t } = useI18n();

const mailTypeIconMap: Record<MailTypeId, string> = {
  OrderConfirmation: 'MailPlus',
  OrderProcessing: 'PackageSearch',
  OrderDelivered: 'MailCheck',
  OrderCancelled: 'MailX',
  OrderRowRemoved: 'ListX',
  OrderRowReturned: 'ListRestart',
  CustomerWishlist: 'Heart',
  CustomerRefunded: 'HandCoins',
  CustomerRegistered: 'UserRoundPlus',
  CustomerUnregistered: 'UserRoundMinus',
  CustomerMessageNotification: 'MessageSquare',
  CustomerPasswordReset: 'KeyRound',
  ProductTellAFriend: 'Share',
  ProductSizeAvailable: 'Tag',
  ProductMonitorNotification: 'BellRing',
};

const iconName = computed(() => mailTypeIconMap[props.mailType._id] ?? 'Mail');
</script>

<template>
  <div class="flex items-center gap-4 px-0 py-4">
    <ContentCardHeader
      :title="mailType.name"
      :description="t(`channels.mail_desc_${mailType._id}`)"
      :icon="iconName"
      size="sm"
    />
    <Badge v-if="mailType.hasOverrides" variant="warning-light" class="ml-auto">
      {{ t('channels.mail_text_overridden') }}
    </Badge>
    <Switch
      :model-value="mailType.active"
      :class="mailType.hasOverrides ? 'ml-4' : 'ml-auto'"
      :aria-label="t('channels.toggle_mail_type_active', { name: mailType.name })"
      @update:model-value="
        emit('update:active', { _id: mailType._id, active: $event })
      "
    />
    <Button
      variant="outline"
      class="size-6 p-1 sm:size-7"
      size="xs"
      :aria-label="t('channels.edit_mail_type', { name: mailType.name })"
      @click="emit('edit', mailType)"
    >
      <LucideEdit class="size-3.5" />
    </Button>
  </div>
</template>
