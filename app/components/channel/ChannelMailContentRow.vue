<script setup lang="ts">
import type { ChannelMailType } from '#shared/types';

const props = defineProps<{
  mailType: ChannelMailType;
}>();

const emit = defineEmits<{
  edit: [mailType: ChannelMailType];
}>();

const { t } = useI18n();

const categoryLabel = computed(() =>
  t(`channels.mail_category_${props.mailType.category.toLowerCase()}`),
);
</script>

<template>
  <div class="flex items-center gap-4 px-4 py-3">
    <LucideMail class="text-muted-foreground size-4 shrink-0" />
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="truncate text-sm font-medium">{{ mailType.name }}</span>
        <Badge variant="secondary">{{ categoryLabel }}</Badge>
        <span
          v-if="mailType.hasOverrides"
          class="bg-primary inline-block size-1.5 shrink-0 rounded-full"
          :title="t('channels.mail_overridden_indicator')"
        >
          <span class="sr-only">{{
            t('channels.mail_overridden_indicator')
          }}</span>
        </span>
      </div>
    </div>
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
