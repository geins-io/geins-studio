<script setup lang="ts">
import type { ChannelMailType, MailCategory } from '#shared/types';

const props = withDefaults(
  defineProps<{
    mailTypes: ChannelMailType[];
    loading?: boolean;
  }>(),
  { loading: false },
);

const emit = defineEmits<{
  edit: [mailType: ChannelMailType];
  'update:active': [payload: { _id: string; active: boolean }];
}>();

const { t } = useI18n();

const categoryConfig: { key: MailCategory }[] = [
  { key: 'Order' },
  { key: 'Customer' },
  { key: 'Product' },
];

const groupedMailTypes = computed(() =>
  categoryConfig
    .map((cat) => ({
      ...cat,
      items: props.mailTypes.filter((m) => m.category === cat.key),
    }))
    .filter((g) => g.items.length > 0),
);
</script>

<template>
  <div :class="cn('pt-2', loading && 'pointer-events-none opacity-50')">
    <!-- Empty state -->
    <Empty v-if="!mailTypes.length" class="border-y">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LucideMail class="size-5" />
        </EmptyMedia>
        <EmptyTitle>{{ t('channels.no_mail_types') }}</EmptyTitle>
      </EmptyHeader>
    </Empty>

    <!-- Grouped by category -->
    <div v-else class="flex flex-col gap-6">
      <section v-for="group in groupedMailTypes" :key="group.key">
        <ContentCardHeader
          :title="t(`channels.mail_category_${group.key.toLowerCase()}`)"
          size="sm"
        />
        <div class="mt-2 divide-y border-y">
          <ChannelMailContentRow
            v-for="mailType in group.items"
            :key="mailType._id"
            :mail-type="mailType"
            @edit="emit('edit', $event)"
            @update:active="emit('update:active', $event)"
          />
        </div>
      </section>
    </div>
  </div>
</template>
