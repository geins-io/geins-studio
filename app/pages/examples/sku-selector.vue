<script setup lang="ts">
import { SelectorMode } from '#shared/types';
import type { SelectorEntity, Product } from '#shared/types';
const { getProductThumbnail } = useGeinsImage();

definePageMeta({
  layout: 'default',
});

const { productApi } = useGeinsRepository();

// Fetch real product data with SKUs
const productsWithSkus = ref<SelectorEntity[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const response = await productApi.list({ fields: ['media', 'skus'] });

    // Transform products to SelectorEntity format with SKUs as children
    productsWithSkus.value =
      response?.items?.map((product: Product) => ({
        _id: `p-${product._id}`,
        name: product.name,
        thumbnail: getProductThumbnail(product.media?.[0]?._id),
        productId: product._id,
        articleNumber: product.articleNumber,
        skus: product.skus?.map((sku) => ({
          _id: sku._id,
          name: sku.name,
          articleNumber: sku.articleNumber,
          thumbnail: getProductThumbnail(product.media?.[0]?._id),
        })),
      })) || [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
  } finally {
    loading.value = false;
  }
});

// Simple mode selection (outputs SKU IDs in the 'ids' array)
const simpleSelection = ref({
  include: ['1050'],
  exclude: [],
});

// Watch selection changes to see SKU IDs
watch(
  simpleSelection,
  (newVal) => {
    console.log('Selected SKU IDs:', newVal.include);
  },
  { deep: true },
);
</script>

<template>
  <div class="container mx-auto py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold">SKU Selector Example</h1>
      <p class="text-muted-foreground mt-2">
        This example demonstrates how to use the selector component with nested
        entities (Products with SKUs). The selector supports expanding rows to
        show and select SKUs.
      </p>
    </div>

    <template v-if="!loading">
      <div class="bg-card mb-6 rounded-lg border p-4">
        <h2 class="mb-2 text-lg font-semibold">Current Selection</h2>
        <div class="text-muted-foreground text-sm">
          <p>
            <strong>Included IDs:</strong>
            {{
              simpleSelection.include.length > 0
                ? simpleSelection.include.join(', ')
                : 'None'
            }}
          </p>
          <p class="mt-1">
            <strong>Excluded IDs:</strong>
            {{
              simpleSelection.exclude.length > 0
                ? simpleSelection.exclude.join(', ')
                : 'None'
            }}
          </p>
        </div>
      </div>

      <!-- Default selector - automatically shows SelectorSelection with expanding rows -->
      <Selector
        v-model:simple-selection="simpleSelection"
        :entities="productsWithSkus"
        entity-name="sku"
        :mode="SelectorMode.Simple"
      />
    </template>

    <div class="bg-muted/50 mt-8 rounded-lg border p-6">
      <h3 class="mb-4 text-lg font-semibold">Key Features:</h3>
      <ul class="text-muted-foreground space-y-2 text-sm">
        <li class="flex items-start">
          <LucideCheck class="mt-0.5 mr-2 size-4 text-green-500" />
          <span
            ><strong>Expanding Rows:</strong> Click the chevron icon to expand
            products and view their SKUs</span
          >
        </li>
        <li class="flex items-start">
          <LucideCheck class="mt-0.5 mr-2 size-4 text-green-500" />
          <span
            ><strong>Nested Selection:</strong> Select individual SKUs instead
            of entire products</span
          >
        </li>
        <li class="flex items-start">
          <LucideCheck class="mt-0.5 mr-2 size-4 text-green-500" />
          <span
            ><strong>Simple Mode Output:</strong> Selected SKU IDs are output in
            the existing 'ids' array</span
          >
        </li>
        <li class="flex items-start">
          <LucideCheck class="mt-0.5 mr-2 size-4 text-green-500" />
          <span
            ><strong>Custom Panel Slot:</strong> The selector header provides a
            'panel' slot for custom implementations</span
          >
        </li>
      </ul>
    </div>
  </div>
</template>
