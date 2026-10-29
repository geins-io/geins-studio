<script setup lang="ts">
import type { CompanyPriceListEntry } from '#shared/types';
import type { FreeCompanyPriceListSlot } from '#shared/utils/price-list';

const props = defineProps<{
  open: boolean;
  /** The free channel and currency slots (`getFreeCompanyPriceListSlots`). */
  slots: FreeCompanyPriceListSlot[];
  /** The company's external id; when set, the dialog warns about external systems. */
  externalId?: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  add: [slot: Pick<CompanyPriceListEntry, 'channel' | 'currency'>];
}>();

const { t } = useI18n();
const accountStore = useAccountStore();

const channel = ref<string>();
const currency = ref<string>();

const currencies = computed(
  () =>
    props.slots.find((slot) => slot.channel === channel.value)?.currencies ??
    [],
);

// Each open starts from the first free slot.
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    channel.value = props.slots[0]?.channel;
    currency.value = props.slots[0]?.currencies[0];
  },
  { immediate: true },
);
// Another channel offers other currencies; keep the pick only if it's free there.
watch(channel, () => {
  if (!currency.value || !currencies.value.includes(currency.value)) {
    currency.value = currencies.value[0];
  }
});

const confirmAdd = () => {
  if (!channel.value || !currency.value) return;
  emit('add', { channel: channel.value, currency: currency.value });
  emit('update:open', false);
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
          <Select v-model="channel">
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
          <Select v-model="currency">
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
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t('cancel') }}
        </Button>
        <Button :disabled="!channel || !currency" @click="confirmAdd">
          {{ t('continue') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
