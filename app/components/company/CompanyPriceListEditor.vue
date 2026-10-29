<script setup lang="ts">
import type {
  PriceListContent,
  ProductPriceList,
  ProductPriceListCreate,
  ProductPriceListUpdate,
} from '#shared/types';

const props = defineProps<{
  /** The company's own list; missing until "Save company" creates it. */
  priceList?: CustomerPriceList;
  /** Create body of a new list (no content), which a new list previews from. */
  seed: ProductPriceListCreate;
}>();

const content = defineModel<PriceListContent>('content');
const dirty = defineModel<boolean>('dirty', { default: false });

const { t } = useI18n();
const { productApi } = useGeinsRepository();

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

const editor = usePriceListEditor({
  priceListId: listId,
  draft,
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
  `company-price-list-content-${props.priceList?._id ?? 'new'}`,
  async () =>
    listId.value
      ? await productApi.priceList.get(listId.value, {
          fields: ['rules', 'selectionquery'],
        })
      : null,
  { immediate: false, default: () => null },
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
};

defineExpose({ afterSave });
</script>

<template>
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
</template>
