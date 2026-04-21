<script setup lang="ts">
import type { ChannelMailType } from '#shared/types';

const props = defineProps<{
  mailType: ChannelMailType;
}>();

const emit = defineEmits<{
  edit: [mailType: ChannelMailType];
  'update:active': [payload: { _id: string; active: boolean }];
}>();

const { t } = useI18n();

const mailTypeIconMap: Record<string, string> = {
  orderConfirmation: 'MailPlus',
  orderProcessing: 'PackageSearch',
  orderDelivered: 'MailCheck',
  orderCancelled: 'MailX',
  orderRowRemoved: 'ListX',
  orderRowReturned: 'ListRestart',
  customerWishlist: 'Heart',
  customerRefunded: 'HandCoins',
  customerRegistered: 'UserRoundPlus',
  customerUnregistered: 'UserRoundMinus',
  customerMessageNotification: 'MessageSquare',
  customerPasswordReset: 'KeyRound',
  productTellAFriend: 'Share',
  productSizeAvailable: 'Tag',
  productMonitorNotification: 'BellRing',
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
