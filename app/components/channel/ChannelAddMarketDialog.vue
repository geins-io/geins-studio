<script setup lang="ts">
import type { Market, ChannelMarketAssignment } from '#shared/types';

const { t } = useI18n();

const props = defineProps<{
  open: boolean;
  allMarkets: Market[];
  assignedMarketIds: string[];
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  add: [markets: ChannelMarketAssignment[]];
}>();

const selectedIds = ref<string[]>([]);

const marketOptions = computed(() =>
  props.allMarkets
    .filter((m) => !props.assignedMarketIds.includes(m._id))
    .map((m) => ({ _id: m._id, name: `${m.country?.name ?? m._id} (${m.currency?._id ?? ''})` })),
);

// O(1) country code lookup by market _id
const marketCountryCodeMap = computed(() => {
  const map = new Map<string, string>();
  for (const m of props.allMarkets) {
    map.set(m._id, m.country?._id ?? '');
  }
  return map;
});

const getCountryCode = (id: string) =>
  marketCountryCodeMap.value.get(id) ?? '';

const confirmAdd = () => {
  const newAssignments: ChannelMarketAssignment[] = selectedIds.value.map(
    (id) => ({
      _id: id,
      active: true,
    }),
  );
  emit('add', newAssignments);
  selectedIds.value = [];
  emit('update:open', false);
};

const handleCancel = () => {
  selectedIds.value = [];
  emit('update:open', false);
};
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('channels.add_market') }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ t('channels.add_market') }}
        </DialogDescription>
      </DialogHeader>
      <div v-if="!marketOptions.length" class="text-muted-foreground text-sm">
        {{ t('channels.no_markets_available') }}
      </div>
      <FormInputTagsSearch
        v-else
        v-model="selectedIds"
        :data-set="marketOptions"
        :placeholder="t('channels.select_markets_placeholder')"
        disable-teleport
      >
        <template #item="{ item }">
          <span v-if="item" class="inline-flex items-center gap-2">
            <div
              :class="[
                flagClass(getCountryCode(item._id)),
                'size-4.5 rounded-full border bg-contain bg-center bg-no-repeat',
              ]"
            />
            {{ item.name }}
          </span>
        </template>
        <template #tag="{ item }">
          <span v-if="item" class="inline-flex items-center gap-2">
            <div
              :class="[
                flagClass(getCountryCode(item._id)),
                'size-4.5 rounded-full border bg-contain bg-center bg-no-repeat',
              ]"
            />
            {{ item.name }}
          </span>
        </template>
      </FormInputTagsSearch>
      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          {{ t('cancel') }}
        </Button>
        <Button :disabled="!selectedIds.length" @click="confirmAdd">
          {{ t('add') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
