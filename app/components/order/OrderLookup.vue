<script setup lang="ts">
import type { Order } from '#shared/types';
import { parseOrderNumber } from '#shared/utils/asset';

/**
 * Finds one order by its number (`GET order/{id}`) and hands it back through
 * `v-model`. Media never checks that an order exists, so a link target must
 * come from here: only an order the API returned can be picked. Typing again
 * clears the pick. `linkedIds` marks an order the caller already links to.
 */
const props = withDefaults(defineProps<{ linkedIds?: string[] }>(), {
  linkedIds: () => [],
});
const order = defineModel<Order | null>({ default: null });

const { orderApi } = useGeinsRepository();
const { geinsLogError } = useGeinsLog('components/OrderLookup.vue');

type LookupState = 'idle' | 'invalid' | 'not-found' | 'error';

const input = ref(order.value?._id ?? '');
const state = ref<LookupState>('idle');
const searching = ref(false);
const inputId = useId();

watch(input, () => {
  state.value = 'idle';
  if (order.value) order.value = null;
});

const alreadyLinked = computed(
  () => !!order.value && props.linkedIds.includes(order.value._id),
);

async function find() {
  if (searching.value) return;
  const id = parseOrderNumber(input.value);
  if (!id) {
    state.value = 'invalid';
    return;
  }
  // The input can change while the lookup is in flight; drop a stale answer.
  const stillAsked = () => parseOrderNumber(input.value) === id;
  searching.value = true;
  try {
    const found = await orderApi.get(id);
    if (!stillAsked()) return;
    order.value = found;
    state.value = 'idle';
  } catch (error) {
    if (!stillAsked()) return;
    const status = getErrorStatus(error);
    // Only a 404 says "no such order"; anything else is a failed lookup.
    state.value = status === 404 || status === 400 ? 'not-found' : 'error';
    if (state.value === 'error') geinsLogError('find', getErrorMessage(error));
  } finally {
    searching.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col gap-2">
      <Label :for="inputId">{{ $t('orders.order_number') }}</Label>
      <div class="flex gap-2">
        <Input
          :id="inputId"
          v-model="input"
          inputmode="numeric"
          autocomplete="off"
          :placeholder="$t('orders.order_number_placeholder')"
          :aria-invalid="state !== 'idle' || undefined"
          data-test="order-lookup-input"
          @keydown.enter.prevent="find"
        />
        <ButtonIcon
          icon="Search"
          variant="secondary"
          :loading="searching"
          :disabled="!input.trim()"
          data-test="order-lookup-find"
          @click="find"
        >
          {{ $t('orders.find_order') }}
        </ButtonIcon>
      </div>
      <p
        v-if="state !== 'idle'"
        class="text-destructive text-sm"
        role="alert"
        data-test="order-lookup-message"
      >
        {{
          state === 'invalid'
            ? $t('orders.order_number_invalid')
            : state === 'not-found'
              ? $t('orders.order_not_found', { number: input.trim() })
              : $t('orders.order_lookup_error')
        }}
      </p>
    </div>

    <OrderRow v-if="order" :order-id="order._id" :order="order">
      <Badge v-if="alreadyLinked" variant="secondary" size="sm">
        {{ $t('asset_library.picker_linked') }}
      </Badge>
    </OrderRow>
  </div>
</template>
