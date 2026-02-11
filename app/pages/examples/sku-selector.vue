<script setup lang="ts">
import { SelectorMode, SelectorEntityType, TableMode } from '#shared/types';
import type { SelectorEntity } from '#shared/types';

definePageMeta({
  layout: 'default',
});

const { productApi } = useGeinsRepository();
const {
  convertToSimpleSelection,
  getFallbackSelection,
  transformProductsToSelectorEntities,
} = useSelector();

// Fetch real product data with SKUs
const productsWithSkus = ref<SelectorEntity[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const response = await productApi.list({ fields: ['media', 'skus'] });

    // Transform products to SelectorEntity format with SKUs as children
    productsWithSkus.value = transformProductsToSelectorEntities(
      response?.items || [],
    );
  } catch (error) {
    const { geinsLogError } = useGeinsLog('sku-selector');
    geinsLogError('Failed to fetch products:', error);
  } finally {
    loading.value = false;
  }
});

const selection = ref<SelectorSelectionInternal>(getFallbackSelection());

const updateSelection = (updatedSelection: SelectorSelectionInternal) => {
  selection.value = updatedSelection;
};

const simpleSelection = computed(() =>
  convertToSimpleSelection(selection.value),
);
const selectedSkus = computed(() => {
  const skus: SelectorEntity[] = [];
  productsWithSkus.value.forEach((product) => {
    if (Number(product.skus?.length) > 1) {
      product.skus?.forEach((sku) => {
        if (simpleSelection.value.includes(sku._id)) {
          skus.push({ ...sku, name: `${product.name} (${sku.name})` });
        }
      });
    } else {
      if (simpleSelection.value.includes(product._id)) {
        skus.push(product);
      }
    }
  });
  return skus;
});
const { getColumns } = useColumns<SelectorEntity>();

const selectedSkuColumns = computed(() => {
  const columns = getColumns(selectedSkus.value);
  return columns;
});
</script>

<template>
  <div class="container mx-auto py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold">SKU selector example</h1>
      <p class="text-muted-foreground mt-2">
        This example demonstrates how to use the selector component with nested
        entities (Products with SKUs). The selector supports expanding rows to
        show and select SKUs.
      </p>
    </div>

    <template v-if="!loading">
      <div class="bg-card mb-6 rounded-lg border p-4">
        <h2 class="mb-2 text-lg font-semibold">Current selection</h2>
        <div class="text-muted-foreground text-sm">
          <p>
            <strong>Included SKU id:s:</strong>
            {{
              simpleSelection.length > 0 ? simpleSelection.join(', ') : 'None'
            }}
          </p>
        </div>
      </div>

      <SelectorPanel
        :selection="selection"
        :mode="SelectorMode.Simple"
        entity-name="sku"
        :entities="productsWithSkus"
        :entity-type="SelectorEntityType.Sku"
        :options="[
          {
            id: 'product',
            group: 'ids',
            label: $t('sku', 2),
          },
        ]"
        @save="updateSelection"
      >
        <ButtonIcon icon="new" size="sm" class="mb-6">
          {{ $t('add_entity', { entityName: 'sku' }) }}
        </ButtonIcon>
      </SelectorPanel>

      <TableView
        :columns="selectedSkuColumns"
        :data="selectedSkus"
        entity-name="sku"
        :mode="TableMode.Simple"
        :page-size="10"
        :show-search="true"
      />
    </template>
  </div>
</template>
