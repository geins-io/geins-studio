<script setup lang="ts">
import type { Market, FlagText } from '#shared/types';

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();
const emptyIcon = resolveIcon('Globe') ?? undefined;

const props = defineProps<{
  defaultMarket: Market | undefined;
  canChange: boolean;
}>();

const emit = defineEmits<{
  change: [];
}>();

interface DefaultMarketRow {
  _id: string;
  country: FlagText;
  currency: string;
  group: string;
  status: boolean;
}

const tableRows = computed<DefaultMarketRow[]>(() => {
  if (!props.defaultMarket) return [];
  const m = props.defaultMarket;
  return [
    {
      _id: m._id,
      country: {
        code: m.country?._id ?? '',
        label: m.country?.name ?? m._id,
      },
      currency: m.currency?._id ?? '—',
      group: m.group ?? '—',
      status: m.active,
    },
  ];
});

const { getColumns, orderAndFilterColumns } = useColumns<DefaultMarketRow>();

const columns = computed(() => {
  let cols = getColumns(tableRows.value, {
    excludeColumns: ['_id'],
    columnTypes: {
      country: 'flag',
      status: 'status',
    },
    columnTitles: {
      country: t('country'),
      currency: t('channels.market_currency'),
      group: t('channels.market_group'),
      status: t('status'),
    },
    sortable: false,
  });
  cols = orderAndFilterColumns(cols, [
    'country',
    'currency',
    'group',
    'status',
  ]);
  return cols;
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
