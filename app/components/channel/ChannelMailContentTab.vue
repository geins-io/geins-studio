<script setup lang="ts">
import type { ChannelMailType } from '#shared/types';

withDefaults(
  defineProps<{
    mailTypes: ChannelMailType[];
    loading?: boolean;
  }>(),
  { loading: false },
);

const emit = defineEmits<{
  edit: [mailType: ChannelMailType];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="pt-2">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col gap-2">
      <Skeleton v-for="i in 3" :key="i" class="h-14 w-full rounded-md" />
    </div>

    <!-- Empty state -->
    <Empty v-else-if="!mailTypes.length" class="border-y">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LucideMail class="size-5" />
        </EmptyMedia>
        <EmptyTitle>{{ t('channels.no_mail_types') }}</EmptyTitle>
      </EmptyHeader>
    </Empty>

    <!-- Flat list -->
    <div v-else class="divide-y border-y">
      <ChannelMailContentRow
        v-for="mailType in mailTypes"
        :key="mailType.type"
        :mail-type="mailType"
        @edit="emit('edit', $event)"
      />
    </div>
  </div>
</template>
