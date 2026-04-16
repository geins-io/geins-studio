<script setup lang="ts">
import type { ChannelMailType, MailTypeId } from '#shared/types';

const props = defineProps<{
  mailType: ChannelMailType;
}>();

const emit = defineEmits<{
  edit: [mailType: ChannelMailType];
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

const iconName = computed(() => mailTypeIconMap[props.mailType.type] ?? 'Mail');
</script>

<template>
  <div class="flex items-center gap-4 px-0 py-4">
    <ContentCardHeader
      :title="mailType.name"
      :description="t(`channels.mail_desc_${mailType.type}`)"
      :icon="iconName"
      size="sm"
    />
    <span
      v-if="mailType.hasOverrides"
      class="bg-primary inline-block size-1.5 shrink-0 rounded-full"
      :title="t('channels.mail_overridden_indicator')"
    >
      <span class="sr-only">{{ t('channels.mail_overridden_indicator') }}</span>
    </span>
    <Button
      variant="outline"
      class="ml-auto size-6 p-1 sm:size-7"
      size="xs"
      :aria-label="t('channels.edit_mail_type', { name: mailType.name })"
      @click="emit('edit', mailType)"
    >
      <LucideEdit class="size-3.5" />
    </Button>
  </div>
</template>
