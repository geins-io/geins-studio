<script setup lang="ts">
import type {
  AssetBulkLinkValue,
  AssetSelectionKind,
  BulkLinkMode,
} from '#shared/types';

/**
 * Properties pane of the bulk "Link to products" action: a **Link as** choice
 * shaped by what the selection holds (`composition`), the product picker, and
 * a live "N assets → M products (X links)" line. Only images/svg can be linked
 * as a product image, so a selection without images links as files with no
 * choice shown, and a mixed one defaults to linking each asset by its type.
 */
const props = defineProps<{
  composition: AssetSelectionKind;
  /** "N assets → M products (X links)" — shared with the confirm step. */
  summary: (value: AssetBulkLinkValue) => string;
}>();
const value = defineModel<AssetBulkLinkValue>({
  default: () => ({ mode: 'byType', productIds: [] }),
});

const { t } = useI18n();
const productsStore = useProductsStore();
const { products, initialized } = storeToRefs(productsStore);
// The store loads lazily; init() is idempotent.
productsStore.init();

const options = computed<{ id: BulkLinkMode; label: string }[]>(() =>
  props.composition === 'images'
    ? [
        { id: 'byType', label: t('asset_library.asset_type.image') },
        { id: 'file', label: t('file') },
      ]
    : [
        { id: 'byType', label: t('asset_library.bulk_link_by_type') },
        { id: 'file', label: t('asset_library.bulk_link_all_as_file') },
      ],
);

const productIds = computed({
  get: () => value.value.productIds,
  set: (ids: string[]) => (value.value = { ...value.value, productIds: ids }),
});
const setMode = (mode: unknown) => {
  if (mode === 'byType' || mode === 'file')
    value.value = { ...value.value, mode };
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="composition !== 'files'" class="flex flex-col gap-2">
      <p class="text-sm font-medium">{{ $t('asset_library.link_as') }}</p>
      <RadioGroup
        :model-value="value.mode"
        class="gap-2"
        @update:model-value="setMode"
      >
        <label
          v-for="option in options"
          :key="option.id"
          class="flex cursor-pointer items-center gap-3 text-sm"
        >
          <RadioGroupItem :value="option.id" />
          {{ option.label }}
        </label>
      </RadioGroup>
      <p
        v-if="composition === 'mixed'"
        class="text-muted-foreground text-sm"
        data-test="bulk-link-split-hint"
      >
        {{ $t('asset_library.bulk_link_split_hint') }}
      </p>
    </div>

    <ProductMultiSelect
      v-model="productIds"
      :products="products"
      :loading="!initialized"
    />

    <p
      v-if="value.productIds.length"
      class="text-muted-foreground text-sm"
      data-test="bulk-link-summary"
    >
      {{ summary(value) }}
    </p>
  </div>
</template>
