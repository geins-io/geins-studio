<script setup lang="ts">
import type {
  Market,
  ChannelMarket,
  ChannelMarketAssignment,
  ChannelMarketRow,
} from '#shared/types';
import type { Row } from '@tanstack/vue-table';

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();
const emptyIcon = resolveIcon('Globe') ?? undefined;

const props = withDefaults(
  defineProps<{
    allMarkets: Market[];
    channelMarkets: ChannelMarket[];
    defaultMarketId: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  add: [markets: ChannelMarketAssignment[]];
  update: [market: ChannelMarketAssignment];
  remove: [marketId: string];
}>();

// Additional markets (everything except the default)
const additionalMarkets = computed(() =>
  props.channelMarkets.filter((m) => m._id !== props.defaultMarketId),
);

// IDs already assigned to this channel
const assignedMarketIds = computed(() =>
  props.channelMarkets.map((m) => m._id),
);

const handleToggleActive = (market: ChannelMarketRow, value: boolean) => {
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

const { toMarketRows, getBaseColumnTitles } = useMarketTable();

// Table rows enriched from full market data
const tableRows = computed<ChannelMarketRow[]>(() => {
  return toMarketRows(additionalMarkets.value);
});

const { getColumns, addActionsColumn } = useColumns<ChannelMarketRow>();

const columns = computed(() => {
  let cols = getColumns(tableRows.value, {
    excludeColumns: ['_id'],
    columnTypes: {
      country: 'flag',
      active: 'switch',
    },
    columnTitles: {
      ...getBaseColumnTitles(),
      active: t('active'),
    },
    columnCellProps: {
      active: {
        onChange: (row: Row<ChannelMarketRow>) => (value: boolean) => {
          handleToggleActive(row.original, value);
        },
        disabled: () => props.disabled,
      },
    },
    sortable: false,
  });
  cols = addActionsColumn(
    cols,
    {
      onDelete: (item: ChannelMarketRow) => openRemoveDialog(item._id),
      disabled: props.disabled,
    },
    'delete',
  );
  return cols;
});

// Add dialog state
const addDialogOpen = ref(false);
</script>

<template>
  <div>
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
        <Button
          variant="outline"
          size="sm"
          :disabled="disabled"
          @click="addDialogOpen = true"
        >
          <LucidePlus class="mr-1 size-3.5" />
          {{ t('add') }}
        </Button>
      </ItemActions>
    </Item>

    <!-- Additional markets table -->
    <div :class="cn('border-b', tableRows.length === 0 ? 'border-t' : '')">
      <TableView
        :columns="columns"
        :data="tableRows"
        :mode="TableMode.Minimal"
        :dim-inactive-rows="true"
        entity-name="market"
        :empty-text="t('channels.additional_markets_empty')"
        :empty-icon="emptyIcon"
      />
    </div>
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
