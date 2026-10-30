<script setup lang="ts">
import type {
  PriceListContent,
  ProductPriceList,
  ProductPriceListCreate,
  ProductPriceListUpdate,
} from '#shared/types';

const props = defineProps<{
  /** The list's entry key: its `_id`, or a draft's key that outlives its create. */
  listKey: string;
  /** The company's own list; missing until "Save company" creates it. */
  priceList?: CustomerPriceList;
  /** Create body of a new list (no content), which a new list previews from. */
  seed: ProductPriceListCreate;
  /** The list's current `active`, which may not be saved yet; defaults to the list's. */
  active?: boolean;
}>();

const content = defineModel<PriceListContent>('content');
const dirty = defineModel<boolean>('dirty', { default: false });

const { t } = useI18n();
const { productApi } = useGeinsRepository();
const accountStore = useAccountStore();

const listId = ref(props.priceList?._id);

// Same shape the price list page edits: no rows (the preview rebuilds them) and
// rules without read-only fields.
const toDraft = (list: ProductPriceList): ProductPriceListUpdate => ({
  ...list,
  products: [],
  rules: (list.rules ?? []).map((rule) => ({
    _id: rule._id,
    quantity: rule.quantity,
    ...(rule.margin && { margin: rule.margin }),
    ...(rule.discountPercent && { discountPercent: rule.discountPercent }),
  })),
});

const draft = ref<ProductPriceListUpdate>({
  ...props.seed,
  rules: [],
  products: [],
});

const readOnly = computed(() => !!props.priceList?.readOnly);

const editor = usePriceListEditor({
  priceListId: listId,
  draft,
  readOnly,
  listPriceTitle: t('pricing.company_price'),
});

watch(
  editor.content,
  (value) => {
    content.value = value;
  },
  { immediate: true },
);
watch(
  editor.isDirty,
  (value) => {
    dirty.value = value;
  },
  { immediate: true },
);

// `CustomerPriceList` leaves out the rules and the selection.
const {
  data: savedList,
  error: loadError,
  execute: loadSavedList,
} = useAsyncData(
  `company-price-list-content-${props.listKey}`,
  async () =>
    listId.value
      ? await productApi.priceList.get(listId.value, {
          fields: ['rules', 'selectionquery'],
        })
      : null,
  { immediate: false, default: () => null },
);

// A draft's name, channel and currency come from its seed until it's saved.
const headerList = computed(() => props.priceList ?? draft.value);
const headerMeta = computed(() => {
  const { channel, currency } = headerList.value;
  return [channel && accountStore.getChannelNameById(channel), currency]
    .filter(Boolean)
    .join(' · ');
});
const active = computed(() => props.active ?? !!headerList.value.active);
const showInactiveNotice = computed(() => readOnly.value && !active.value);

// A background read: on failure the header just leaves the counts out.
const {
  data: countsList,
  error: countsError,
  refresh: refreshCounts,
} = useAsyncData(
  `company-price-list-counts-${props.listKey}`,
  async () =>
    listId.value
      ? await productApi.priceList.get(
          listId.value,
          { fields: ['counts'] },
          { suppressErrorToast: true },
        )
      : null,
  { default: () => null },
);
const summaryCounts = computed(() =>
  countsError.value ? undefined : getPriceListSummaryCounts(countsList.value),
);

// Rendered only once seeded: a failed load must not show an empty editor whose
// save would replace the list's rules and selection.
const ready = ref(false);

const load = async () => {
  await loadSavedList();
  if (loadError.value) return;
  if (savedList.value) {
    draft.value = toDraft(savedList.value);
    editor.seed(savedList.value);
  }
  ready.value = true;
  await editor.load();
  editor.captureBaseline();
};

onMounted(load);

/** Re-seeds from the saved list (new rule `_id`s), rebuilds its rows and re-baselines. */
const afterSave = async (saved: ProductPriceList) => {
  // The re-seed replaces the selection; `saving` keeps it from previewing again.
  editor.saving.value = true;
  try {
    listId.value = saved._id;
    draft.value = toDraft(saved);
    editor.seed(saved);
    await editor.afterSave();
  } finally {
    editor.saving.value = false;
  }
  editor.captureBaseline();
  await refreshCounts();
};

defineExpose({ afterSave, refreshCounts });
</script>

<template>
  <div class="flex flex-col gap-6">
    <ContentEditCard :title="headerList.name ?? ''" :description="headerMeta">
      <template #header-action>
        <StatusBadge :status="active" data-test="price-list-active" />
      </template>
      <template v-if="summaryCounts || readOnly" #default>
        <div class="flex flex-col gap-4">
          <p
            v-if="summaryCounts"
            class="text-muted-foreground text-xs sm:text-sm"
            data-test="price-list-counts"
          >
            {{
              $t('customers.company_set_prices_counts', {
                manual: summaryCounts.manual,
                volume: summaryCounts.volume,
              })
            }}
          </p>
          <Item v-if="readOnly" variant="outline" data-test="price-list-lock">
            <ItemMedia variant="icon">
              <LucideLock class="text-muted-foreground" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                {{ $t('pricing.price_list_read_only_title') }}
              </ItemTitle>
              <ItemDescription>
                {{ $t('pricing.managed_externally') }}
              </ItemDescription>
            </ItemContent>
          </Item>
          <Feedback
            v-if="showInactiveNotice"
            type="info"
            data-test="price-list-inactive"
          >
            <template #title>
              {{ $t('customers.company_set_prices_erp_inactive_title') }}
            </template>
            <template #description>
              {{ $t('customers.company_set_prices_erp_inactive_description') }}
            </template>
          </Feedback>
        </div>
      </template>
    </ContentEditCard>
    <Card v-if="loadError">
      <CardContent class="p-0">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="destructive">
              <LucideXCircle />
            </EmptyMedia>
            <EmptyTitle>{{ $t('feedback_error') }}</EmptyTitle>
            <EmptyDescription>
              {{ $t('error_empty_description') }}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <ButtonIcon icon="retry" variant="secondary" @click="load">
              {{ $t('retry') }}
            </ButtonIcon>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
    <div v-else-if="!ready" class="flex flex-col gap-8">
      <Skeleton class="h-48 w-full rounded-lg" />
      <Skeleton class="h-96 w-full rounded-lg" />
    </div>
    <PriceListEditor v-else :editor="editor" />
  </div>
</template>
