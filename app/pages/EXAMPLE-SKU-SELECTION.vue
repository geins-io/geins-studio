<script setup lang="ts">
/**
 * Example SKU Selection Component
 *
 * This is a complete working example of SKU selection using the new
 * table grouping feature. Copy this to your pages to get started.
 */

import { SelectorMode, SelectorSelectionStrategy } from '#shared/types';
import type { Product, Sku, SelectorSelectionSimpleBase } from '#shared/types';

// Composables
const { flattenChildren } = useEntityFlattener();
const { getEmptySimpleSelectionBase } = useSelector();
const { productApi } = useGeinsRepository();

// State
const products = ref<Product[]>([]);
const loading = ref(true);
const selectedSkus = ref<SelectorSelectionSimpleBase>(
  getEmptySimpleSelectionBase(),
);
const { transformProducts } = useProductsStore();

// Fetch products with SKUs
const fetchProducts = async () => {
  loading.value = true;
  try {
    const response = await productApi.list({
      fields: ['skus', 'localizations', 'media', 'prices'],
    });
    products.value = transformProducts(response.items || []);
  } catch (error) {
    console.error('Failed to fetch products:', error);
  } finally {
    loading.value = false;
  }
};

// Flatten products into SKUs with parent info
const skuEntities = computed(() => {
  if (!products.value.length) return [];

  return flattenChildren<Product, Sku>(products.value, 'skus', [
    '_id',
    'name',
    'thumbnail',
    'articleNumber',
  ]);
});

// Column order for optimal display
const skuColumnOrder = [
  'select',
  'parent_thumbnail',
  'parent_name',
  '_id',
  'articleNumber',
  'stock',
];

// Computed selected SKU details
const selectedSkuDetails = computed(() => {
  return skuEntities.value.filter((sku) =>
    selectedSkus.value.include.includes(sku._id),
  );
});

const uniqueProductsCount = computed(() => {
  const productIds = new Set(
    selectedSkuDetails.value.map((sku) => sku.parent_productId),
  );
  return productIds.size;
});

// Watch selection changes (for debugging)
watch(
  selectedSkus,
  (newSelection) => {
    console.log('Selected SKUs:', newSelection.include);
    console.log('Excluded SKUs:', newSelection.exclude);
  },
  { deep: true },
);

// Fetch on mount
onMounted(() => {
  fetchProducts();
});

// Reset selection
const resetSelection = () => {
  selectedSkus.value = getEmptySimpleSelectionBase();
};

// Example: Submit to API
const handleSubmit = async () => {
  console.log('Submitting selection:', selectedSkus.value);

  // Example API call (replace with your endpoint)
  // await $fetch('/api/quotation/skus', {
  //   method: 'POST',
  //   body: {
  //     skuIds: selectedSkus.value.include,
  //     excludedSkuIds: selectedSkus.value.exclude
  //   }
  // });
};
</script>

<template>
  <div class="container mx-auto space-y-6 p-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold">SKU Selection Example</h1>
      <p class="text-muted-foreground mt-2">
        Select specific SKUs from products. SKUs are grouped by their parent
        product.
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"
        ></div>
        <p class="text-muted-foreground">Loading products...</p>
      </div>
    </div>

    <!-- Selector -->
    <div v-else>
      <Selector
        :entities="skuEntities"
        entity-name="sku"
        :mode="SelectorMode.Simple"
        v-model:simple-selection="selectedSkus"
        :columns-order="skuColumnOrder"
        :table-grouping="{
          groupBy: ['parent__id'],
          enableExpanding: true,
          defaultExpanded: false,
        }"
        :allow-exclusions="true"
        :selection-strategy="SelectorSelectionStrategy.None"
      />
    </div>

    <!-- Selection Summary -->
    <div
      v-if="selectedSkus.include.length || selectedSkus.exclude.length"
      class="bg-card rounded-lg border p-6"
    >
      <h3 class="mb-4 text-lg font-semibold">Selection Summary</h3>

      <div class="grid gap-4 sm:grid-cols-3">
        <div class="space-y-1">
          <p class="text-muted-foreground text-sm">Selected SKUs</p>
          <p class="text-2xl font-bold">{{ selectedSkus.include.length }}</p>
        </div>

        <div class="space-y-1" v-if="selectedSkus.exclude.length">
          <p class="text-muted-foreground text-sm">Excluded SKUs</p>
          <p class="text-2xl font-bold">{{ selectedSkus.exclude.length }}</p>
        </div>

        <div class="space-y-1">
          <p class="text-muted-foreground text-sm">Unique Products</p>
          <p class="text-2xl font-bold">{{ uniqueProductsCount }}</p>
        </div>
      </div>

      <!-- Selected SKU Details (Optional) -->
      <details class="mt-6" v-if="selectedSkuDetails.length">
        <summary class="cursor-pointer font-medium hover:underline">
          View Selected SKU Details
        </summary>
        <div class="mt-3 space-y-2">
          <div
            v-for="sku in selectedSkuDetails.slice(0, 10)"
            :key="sku._id"
            class="bg-muted rounded p-2 text-sm"
          >
            <strong>{{ sku.parent_name }}</strong> - {{ sku.name }} ({{
              sku._id
            }})
          </div>
          <p
            v-if="selectedSkuDetails.length > 10"
            class="text-muted-foreground text-sm"
          >
            ... and {{ selectedSkuDetails.length - 10 }} more
          </p>
        </div>
      </details>
    </div>

    <!-- Actions -->
    <div class="flex gap-3">
      <Button
        @click="handleSubmit"
        :disabled="!selectedSkus.include.length"
        size="lg"
      >
        Submit Selection ({{ selectedSkus.include.length }} SKUs)
      </Button>

      <Button
        variant="outline"
        @click="resetSelection"
        :disabled="!selectedSkus.include.length && !selectedSkus.exclude.length"
        size="lg"
      >
        Clear Selection
      </Button>

      <Button variant="secondary" @click="fetchProducts" size="lg">
        Refresh Products
      </Button>
    </div>

    <!-- Debug Info (Remove in production) -->
    <details class="text-xs">
      <summary class="text-muted-foreground cursor-pointer hover:underline">
        Debug Information
      </summary>
      <pre class="bg-muted mt-2 overflow-auto rounded p-4">{{
        {
          totalProducts: products.length,
          totalSkus: skuEntities.length,
          selectedInclude: selectedSkus.include,
          selectedExclude: selectedSkus.exclude,
        }
      }}</pre>
    </details>
  </div>
</template>
