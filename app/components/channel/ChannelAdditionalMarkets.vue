<script setup lang="ts">
import type { Market, ChannelMarketAssignment } from '#shared/types';

const { t } = useI18n();

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

const handleToggleActive = (market: Market, value: boolean) => {
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
  <div v-if="additionalMarkets.length">
    <table class="w-full">
      <thead>
        <tr class="border-b">
          <th class="px-4 py-2 text-left text-sm font-bold">
            {{ t('country') }}
          </th>
          <th class="px-4 py-2 text-left text-sm font-bold">
            {{ t('channels.market_currency') }}
          </th>
          <th class="px-4 py-2 text-left text-sm font-bold">
            {{ t('channels.market_group') }}
          </th>
          <th class="px-4 py-2 text-right text-sm font-bold">
            {{ t('active') }}
          </th>
          <th class="w-10" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="market in additionalMarkets"
          :key="market._id"
          class="border-b last:border-b-0"
        >
          <td class="px-4 py-3">
            <span class="inline-flex items-center gap-2">
              <div
                v-if="market.country?._id"
                :class="[
                  flagClass(market.country._id),
                  'size-4.5 rounded-full border bg-contain bg-center bg-no-repeat',
                ]"
              />
              <span class="text-sm">{{ market.country?.name ?? market._id }}</span>
            </span>
          </td>
          <td class="px-4 py-3 text-sm">
            {{ market.currency?._id ?? '—' }}
          </td>
          <td class="text-muted-foreground px-4 py-3 text-sm">
            {{ market.group ?? '—' }}
          </td>
          <td class="px-4 py-3 text-right">
            <Switch
              :model-value="market.active"
              :disabled="isActivating(market._id)"
              @update:model-value="handleToggleActive(market, $event)"
            />
          </td>
          <td class="px-2 py-3">
            <Button
              variant="ghost"
              size="icon"
              class="size-8"
              @click="openRemoveDialog(market._id)"
            >
              <LucideTrash2 class="text-muted-foreground size-4" />
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- Activating notice -->
    <div
      v-if="activatingMarkets.size"
      class="text-muted-foreground border-t px-4 py-2 text-xs"
    >
      {{ t('channels.activating_market_notice') }}
    </div>
  </div>
  <Empty v-else class="gap-2 border-y p-0">
    <EmptyMedia variant="icon" class="size-8">
      <LucideGlobe class="size-5" />
    </EmptyMedia>
    <EmptyHeader>
      <EmptyDescription>
        {{ t('channels.additional_markets_empty') }}
      </EmptyDescription>
    </EmptyHeader>
  </Empty>

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
