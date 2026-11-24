<script setup lang="ts">
import type { Order } from '#shared/types';
import { parseOrderNumbers } from '#shared/utils/asset';

/**
 * Finds orders by number and collects them in `v-model`. The field takes one
 * or several numbers; Find looks them up in one `POST order/query` and adds
 * the orders found to the list. Media never checks that an order exists, so a
 * link target must come from here: only an order the API returned can be
 * picked. `linkedIds` marks orders the caller already links to.
 */
const props = withDefaults(defineProps<{ linkedIds?: string[] }>(), {
  linkedIds: () => [],
});
const orders = defineModel<Order[]>({ default: () => [] });

const { orderApi } = useGeinsRepository();
const { batchQueryNoPagination } = useBatchQuery();
const { geinsLogError } = useGeinsLog('components/OrderLookup.vue');

const input = ref('');
const searching = ref(false);
const failed = ref(false);
const notFound = ref<string[]>([]);
const invalid = ref<string[]>([]);
const inputId = useId();

const linked = computed(() => new Set(props.linkedIds));
const unmatched = computed(() => notFound.value.length + invalid.value.length);

// A dialog or bulk pane closing mid-lookup unmounts this; a late answer must
// not land in the next value.
let active = true;
onBeforeUnmount(() => (active = false));

function clearMessages() {
  failed.value = false;
  notFound.value = [];
  invalid.value = [];
}

// A single-line input flattens or drops the line breaks of a pasted column
// (e.g. from a spreadsheet); keep them as separators.
function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text');
  if (!text || !/[\r\n]/.test(text)) return;
  event.preventDefault();
  const field = event.target as HTMLInputElement;
  const start = field.selectionStart ?? input.value.length;
  const end = field.selectionEnd ?? start;
  const flat = text
    .trim()
    .split(/\s*[\r\n]+\s*/)
    .join(', ');
  input.value = input.value.slice(0, start) + flat + input.value.slice(end);
  clearMessages();
}

async function find() {
  if (searching.value || !input.value.trim()) return;
  clearMessages();
  const searched = input.value;
  const parsed = parseOrderNumbers(searched);
  const listed = new Set(orders.value.map((order) => order._id));
  const ids = parsed.ids.filter((id) => !listed.has(id));
  if (!ids.length) {
    invalid.value = parsed.invalid;
    input.value = '';
    return;
  }
  searching.value = true;
  try {
    const result = await orderApi.query(
      {
        include: [{ selections: [{ orderIds: ids }] }],
        ...batchQueryNoPagination.value,
      },
      undefined,
      { suppressErrorToast: true },
    );
    if (!active) return;
    // Only what was asked for, in the order it was typed.
    const byId = new Map(
      (Array.isArray(result?.items) ? result.items : []).map((order) => [
        order._id,
        order,
      ]),
    );
    orders.value = [
      ...orders.value,
      ...ids.flatMap((id) => byId.get(id) ?? []),
    ];
    notFound.value = ids.filter((id) => !byId.has(id));
    invalid.value = parsed.invalid;
    // Numbers typed while the lookup ran stay for the next Find.
    if (input.value === searched) input.value = '';
  } catch (error) {
    if (!active) return;
    // The numbers stay in the field, so Retry asks again.
    failed.value = true;
    geinsLogError('find', getErrorMessage(error));
  } finally {
    searching.value = false;
  }
}

function remove(id: string) {
  orders.value = orders.value.filter((order) => order._id !== id);
}
</script>

<template>
  <!-- min-w-0: inside a dialog's grid, a row's truncated text would otherwise
       widen the whole dialog past its border. Children never shrink: in the
       height-constrained bulk pane the list would be squeezed. -->
  <div class="flex min-w-0 flex-col gap-3 *:shrink-0">
    <div class="flex flex-col gap-2">
      <Label :for="inputId">{{ $t('orders.order_number', 2) }}</Label>
      <InputGroup>
        <InputGroupInput
          :id="inputId"
          v-model="input"
          autocomplete="off"
          :placeholder="$t('orders.order_number_placeholder')"
          data-test="order-lookup-input"
          @input="clearMessages"
          @paste="onPaste"
          @keydown.enter.prevent="find"
        />
        <InputGroupAddon align="inline-end">
          <!-- The addon mutes its text; the button keeps the normal color. -->
          <InputGroupButton
            variant="outline"
            size="sm"
            class="text-foreground h-7 rounded-lg px-2"
            :disabled="!input.trim() || searching"
            data-test="order-lookup-find"
            @click="find"
          >
            <LucideLoaderCircle
              v-if="searching"
              class="size-3.5 animate-spin"
              aria-hidden="true"
            />
            <LucideSearch v-else class="size-3.5" aria-hidden="true" />
            {{ $t('orders.find_order') }}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p class="text-muted-foreground text-xs">
        {{ $t('orders.order_numbers_description') }}
      </p>
    </div>

    <!-- Nothing found is an answer, not a failure: a calm row, not red. -->
    <div
      v-if="unmatched"
      class="text-muted-foreground flex items-center gap-2.5 rounded-lg border border-dashed px-3 py-2 text-sm"
      role="status"
      data-test="order-lookup-message"
    >
      <LucideSearchX class="size-4 shrink-0" aria-hidden="true" />
      <div class="min-w-0 break-words">
        <p v-if="notFound.length" class="text-foreground font-semibold">
          {{
            $t(
              'orders.order_not_found',
              { numbers: notFound.join(', ') },
              notFound.length,
            )
          }}
        </p>
        <p v-if="invalid.length" class="text-foreground font-semibold">
          {{
            $t(
              'orders.order_number_invalid',
              { numbers: invalid.join(', ') },
              invalid.length,
            )
          }}
        </p>
        <p class="text-xs">
          {{ $t('orders.order_not_found_hint', unmatched) }}
        </p>
      </div>
    </div>

    <Feedback v-else-if="failed" type="negative">
      <template #title>
        {{ $t('failed_to_fetch_entity', { entityKey: 'order' }, 2) }}
      </template>
      <template #description>{{ $t('error_try_again') }}</template>
      <template #actions>
        <ButtonIcon icon="retry" variant="secondary" size="sm" @click="find">
          {{ $t('retry') }}
        </ButtonIcon>
      </template>
    </Feedback>

    <p
      v-if="!orders.length"
      class="text-muted-foreground rounded-lg border px-3 py-6 text-center text-sm"
    >
      {{ $t('no_entity_selected', { entityKey: 'order' }, 2) }}
    </p>
    <ul
      v-else
      class="flex max-h-60 flex-col gap-2 overflow-y-auto"
      data-test="order-lookup-list"
    >
      <li v-for="order in orders" :key="order._id">
        <OrderRow :order-id="order._id" :order="order">
          <Badge v-if="linked.has(order._id)" variant="secondary" size="sm">
            {{ $t('asset_library.picker_linked') }}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            class="size-7 shrink-0"
            :aria-label="$t('remove_entity', { entityKey: 'order' })"
            data-test="order-lookup-remove"
            @click="remove(order._id)"
          >
            <LucideX class="size-4" />
          </Button>
        </OrderRow>
      </li>
    </ul>
  </div>
</template>
