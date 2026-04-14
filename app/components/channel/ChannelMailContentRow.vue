<script setup lang="ts">
import type { ChannelMailType, MailTypeId } from '#shared/types';

const props = defineProps<{
  mailType: ChannelMailType;
}>();

const emit = defineEmits<{
  edit: [mailType: ChannelMailType];
}>();

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();

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
  ProductTellAFriend: 'Forward',
  ProductSizeAvailable: 'Ruler',
  ProductMonitorNotification: 'BellRing',
};

const iconName = computed(() => mailTypeIconMap[props.mailType.type] ?? 'Mail');
</script>

<template>
  <div class="flex items-center gap-4 px-4 py-3">
    <Item class="min-w-0 flex-1 gap-4 p-0 text-left">
      <ItemMedia variant="icon" class="size-9">
        <component :is="resolveIcon(iconName)" class="size-5" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle class="text-sm font-medium">{{ mailType.name }}</ItemTitle>
        <ItemDescription class="text-muted-foreground text-xs">
          {{ t(`channels.mail_desc_${mailType.type}`) }}
        </ItemDescription>
      </ItemContent>
    </Item>
    <span
      v-if="mailType.hasOverrides"
      class="bg-primary inline-block size-1.5 shrink-0 rounded-full"
      :title="t('channels.mail_overridden_indicator')"
    >
      <span class="sr-only">{{ t('channels.mail_overridden_indicator') }}</span>
    </span>
    <Button
      variant="ghost"
      size="icon"
      :aria-label="t('channels.edit_mail_type', { name: mailType.name })"
      @click="emit('edit', mailType)"
    >
      <LucidePencil class="size-4" />
    </Button>
  </div>
</template>
