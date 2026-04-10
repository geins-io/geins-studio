<script setup lang="ts">
import type { ChannelMarket, ChannelMarketRow } from '#shared/types';

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();
const emptyIcon = resolveIcon('Globe') ?? undefined;

const props = defineProps<{
  defaultMarket: ChannelMarket | undefined;
  canChange: boolean;
}>();

const emit = defineEmits<{
  change: [];
}>();

const { toMarketRows, getBaseColumnTitles } = useMarketTable();

const tableRows = computed<ChannelMarketRow[]>(() => {
  if (!props.defaultMarket) return [];
  return toMarketRows([props.defaultMarket]);
});

const { getColumns } = useColumns<ChannelMarketRow>();

const columns = computed(() => {
  return getColumns(tableRows.value, {
    excludeColumns: ['_id'],
    columnTypes: {
      country: 'flag',
      active: 'status',
    },
    columnTitles: {
      ...getBaseColumnTitles(),
      active: t('status'),
    },
    sortable: false,
  });
});
</script>

<template>
  <div>
    <Item class="px-0">
      <ItemContent>
        <ItemTitle class="text-base font-bold">
          {{ t('channels.default_market') }}
        </ItemTitle>
      </ItemContent>
      <ItemActions>
        <Button
          v-if="canChange"
          variant="outline"
          size="sm"
          @click="emit('change')"
        >
          {{ t('change') }}
        </Button>
      </ItemActions>
    </Item>

    <TableView
      :columns="columns"
      :data="tableRows"
      :mode="TableMode.Minimal"
      entity-name="market"
      :empty-text="t('channels.additional_markets_empty')"
      :empty-icon="emptyIcon"
    />
  </div>
</template>
