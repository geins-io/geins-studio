<script setup lang="ts">
import type { CompanyPriceListEntry, CustomerPriceList } from '#shared/types';
import type { FreeCompanyPriceListSlot } from '#shared/utils/price-list';

const props = withDefaults(
  defineProps<{
    open: boolean;
    /** The free channel and currency slots (`getFreeCompanyPriceListSlots`). */
    slots: FreeCompanyPriceListSlot[];
    /** Shared lists to start from; those in the chosen slot are offered. */
    sources?: CustomerPriceList[];
    /** The company's external id; when set, the dialog warns about external systems. */
    externalId?: string;
    /** The chosen source is loading: Continue shows a spinner. */
    loading?: boolean;
    /** The chosen source failed to load. */
    error?: boolean;
  }>(),
  { sources: () => [] },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  /** Without a `sourceId` the list starts empty. The host closes the dialog. */
  add: [
    slot: Pick<CompanyPriceListEntry, 'channel' | 'currency'>,
    sourceId?: string,
  ];
}>();

const { t } = useI18n();
const accountStore = useAccountStore();

// Select items can't have an empty value.
const EMPTY_LIST = 'empty';

const channel = ref<string>();
const currency = ref<string>();
const source = ref(EMPTY_LIST);

const currencies = computed(
  () =>
    props.slots.find((slot) => slot.channel === channel.value)?.currencies ??
    [],
);
// Channels compare as strings, like the free slots (`getFreeCompanyPriceListSlots`).
const sourceOptions = computed(() =>
  props.sources.filter(
    (list) =>
      String(list.channel) === channel.value &&
      list.currency === currency.value,
  ),
);

// Each open starts from the first free slot.
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    channel.value = props.slots[0]?.channel;
    currency.value = props.slots[0]?.currencies[0];
    source.value = EMPTY_LIST;
  },
  { immediate: true },
);
// Another channel offers other currencies; keep the pick only if it's free there.
watch(channel, () => {
  if (!currency.value || !currencies.value.includes(currency.value)) {
    currency.value = currencies.value[0];
  }
});
// A source belongs to one slot.
watch([channel, currency], () => {
  source.value = EMPTY_LIST;
});

const confirmAdd = () => {
  if (!channel.value || !currency.value) return;
  emit(
    'add',
    { channel: channel.value, currency: currency.value },
    source.value === EMPTY_LIST ? undefined : source.value,
  );
};
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {{ t('add_entity', { entityKey: 'company_price_list' }) }}
        </DialogTitle>
        <DialogDescription>
          {{ t('customers.add_company_price_list_description') }}
        </DialogDescription>
      </DialogHeader>
      <Feedback v-if="externalId?.trim()" type="warning">
        <template #title>
          {{ t('customers.company_set_prices_external_title') }}
        </template>
        <template #description>
          {{ t('customers.company_set_prices_external_description') }}
        </template>
      </Feedback>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label>{{ t('channel') }}</Label>
          <Select v-model="channel" :disabled="loading">
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="slot in slots"
                :key="slot.channel"
                :value="slot.channel"
              >
                {{ accountStore.getChannelNameById(slot.channel) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>{{ t('currency') }}</Label>
          <Select v-model="currency" :disabled="loading">
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="code in currencies" :key="code" :value="code">
                {{ code }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2 sm:col-span-2">
          <Label>{{ t('customers.start_from') }}</Label>
          <Select v-model="source" :disabled="loading">
            <SelectTrigger class="w-full" data-test="price-list-source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="EMPTY_LIST">
                {{ t('customers.empty_list') }}
              </SelectItem>
              <SelectItem
                v-for="list in sourceOptions"
                :key="list._id"
                :value="list._id"
              >
                {{ list.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Feedback
        v-if="error"
        type="negative"
        data-test="price-list-source-error"
      >
        <template #title>
          {{ t('error_loading_entity', { entityKey: 'price_list' }) }}
        </template>
        <template #description>
          {{ t('error_try_again') }}
        </template>
      </Feedback>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t('cancel') }}
        </Button>
        <Button
          :disabled="!channel || !currency"
          :loading="loading"
          @click="confirmAdd"
        >
          {{ t('continue') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
