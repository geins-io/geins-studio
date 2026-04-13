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
}>();

const { t } = useI18n();

const categoryOrder: MailCategory[] = ['Order', 'Customer', 'Product'];

const grouped = computed(() => {
  const groups: Record<MailCategory, ChannelMailType[]> = {
    Order: [],
    Customer: [],
    Product: [],
  };
  for (const mt of props.mailTypes) groups[mt.category].push(mt);
  return groups;
});

const nonEmptyCategories = computed(() =>
  categoryOrder.filter((c) => grouped.value[c].length > 0),
);
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

    <!-- Grouped rows -->
    <div v-else class="flex flex-col gap-6">
      <div
        v-for="category in nonEmptyCategories"
        :key="category"
        class="flex flex-col"
      >
        <h3
          class="text-muted-foreground px-4 pb-2 text-xs font-semibold tracking-wide uppercase"
        >
          {{ t(`channels.mail_category_${category.toLowerCase()}`) }}
        </h3>
        <div class="divide-y border-y">
          <ChannelMailContentRow
            v-for="mailType in grouped[category]"
            :key="mailType.type"
            :mail-type="mailType"
            @edit="emit('edit', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
