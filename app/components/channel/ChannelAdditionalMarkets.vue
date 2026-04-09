<script setup lang="ts">
import type { Market, ChannelMarketAssignment, FlagText } from '#shared/types';
import type { Row } from '@tanstack/vue-table';

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();
const emptyIcon = resolveIcon('Globe') ?? undefined;

const props = defineProps<{
  allMarkets: Market[];
  channelMarkets: Market[];
}>();

const emit = defineEmits<{
  add: [markets: ChannelMarketAssignment[]];
  update: [market: ChannelMarketAssignment];
  remove: [marketId: string];
}>();

// Additional markets (everything except index 0 = default)
const additionalMarkets = computed(() => props.channelMarkets.slice(1));

// IDs already assigned to this channel
const assignedMarketIds = computed(() =>
  props.channelMarkets.map((m) => m._id),
);

// UX guardrail: track activating markets with a cooldown
const activatingMarkets = ref(new Set<string>());
const isActivating = (id: string) => activatingMarkets.value.has(id);

const handleToggleActive = (market: MarketRow, value: boolean) => {
  // UX guardrail: disable switch briefly
  activatingMarkets.value.add(market._id);
  setTimeout(() => {
    activatingMarkets.value = new Set(
      [...activatingMarkets.value].filter((id) => id !== market._id),
    );
  }, 3000);

  emit('update', {
    _id: market._id,
    active: value,
  });
};

// Remove market confirmation
const marketPendingRemoval = ref<string | null>(null);
const removeDialogOpen = ref(false);

const openRemoveDialog = (marketId: string) => {
  marketPendingRemoval.value = marketId;
  removeDialogOpen.value = true;
};

const confirmRemove = () => {
  if (marketPendingRemoval.value) {
    emit('remove', marketPendingRemoval.value);
  }
  marketPendingRemoval.value = null;
  removeDialogOpen.value = false;
};

// Table row type
interface MarketRow {
  _id: string;
  country: FlagText;
  currency: string;
  group: string;
  active: boolean;
}

// Table rows enriched from full market data
const tableRows = computed<MarketRow[]>(() => {
  return additionalMarkets.value.map((market) => ({
    _id: market._id,
    country: {
      code: market.country?._id ?? '',
      label: market.country?.name ?? market._id,
    },
    currency: market.currency?._id ?? '—',
    group: market.group ?? '—',
    active: market.active,
  }));
});

const { getColumns, orderAndFilterColumns, addActionsColumn } =
  useColumns<MarketRow>();

const columns = computed(() => {
  let cols = getColumns(tableRows.value, {
    excludeColumns: ['_id'],
    columnTypes: {
      country: 'flag',
      active: 'switch',
    },
    columnTitles: {
      country: t('country'),
      currency: t('channels.market_currency'),
      group: t('channels.market_group'),
      active: t('active'),
    },
    columnCellProps: {
      active: {
        onChange: (row: Row<MarketRow>) => (value: boolean) => {
          handleToggleActive(row.original, value);
        },
        disabled: (row: Row<MarketRow>) => isActivating(row.original._id),
      },
    },
    sortable: false,
  });
  cols = orderAndFilterColumns(cols, [
    'country',
    'currency',
    'group',
    'active',
  ]);
  cols = addActionsColumn(
    cols,
    {
      onDelete: (item: MarketRow) => openRemoveDialog(item._id),
    },
    'delete',
  );
  return cols;
});

// Add dialog state
const addDialogOpen = ref(false);
</script>

<template>
  <!-- Additional markets sub-section -->
  <Item class="px-0 pt-4">
    <ItemContent>
      <ItemTitle class="text-base font-bold">
        {{ t('channels.additional_markets') }}
      </ItemTitle>
      <ItemDescription>
        {{ t('channels.additional_markets_description') }}
      </ItemDescription>
    </ItemContent>
    <ItemActions>
      <Button variant="outline" size="sm" @click="addDialogOpen = true">
        <LucidePlus class="mr-1 size-3.5" />
        {{ t('add') }}
      </Button>
    </ItemActions>
  </Item>

  <!-- Additional markets table -->
  <TableView
    :columns="columns"
    :data="tableRows"
    :mode="TableMode.Minimal"
    entity-name="market"
    :empty-text="t('channels.additional_markets_empty')"
    :empty-icon="emptyIcon"
  />
  <!-- Activating notice -->
  <div
    v-if="activatingMarkets.size"
    class="text-muted-foreground border-t px-4 py-2 text-xs"
  >
    {{ t('channels.activating_market_notice') }}
  </div>

  <!-- Remove market confirmation dialog -->
  <AlertDialog v-model:open="removeDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('channels.remove_market') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('channels.remove_market_description') }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ t('cancel') }}</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="confirmRemove"
        >
          {{ t('remove') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- Add market dialog -->
  <ChannelAddMarketDialog
    :open="addDialogOpen"
    :all-markets="allMarkets"
    :assigned-market-ids="assignedMarketIds"
    @update:open="addDialogOpen = $event"
    @add="emit('add', $event)"
  />
</template>
