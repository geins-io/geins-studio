import { defineStore } from 'pinia';
import type { Product, Category, Brand } from '#shared/types';

/**
 * Products store — caches product, category, and brand data for cross-page use.
 *
 * Fetches and transforms product data from the API, providing thumbnail URLs
 * and localized names. Responds to language changes by re-fetching.
 *
 * Initialization is lazy: every consumer calls `init()` (idempotent; concurrent
 * calls share one load). Nothing loads it at login — only `reset()` runs on
 * logout (`geins-global.ts`).
 *
 * @example
 * ```ts
 * const productsStore = useProductsStore();
 * const { products, categories, brands } = storeToRefs(productsStore);
 * ```
 */
export const useProductsStore = defineStore('products', () => {
  const { geinsLogWarn } = useGeinsLog('store/products.ts');
  const { productApi } = useGeinsRepository();
  const accountStore = useAccountStore();
  const { currentLanguage } = storeToRefs(accountStore);
  const { getProductThumbnail } = useGeinsImage();

  // STATE
  const products = ref<Product[]>([]);
  const categories = ref<Category[]>([]);
  const brands = ref<Brand[]>([]);
  const ready = ref(false);
  const initialized = ref(false);

  // ACTIONS

  const SILENT: { suppressErrorToast: true } = { suppressErrorToast: true };

  const DEFAULT_PRODUCT_FIELDS: ProductFieldsFilter[] = [
    'localizations',
    'media',
    'prices',
  ];

  // Readers that don't touch state, so `load()` can drop a stale result.
  async function readProducts(
    fields: ProductFieldsFilter[] = DEFAULT_PRODUCT_FIELDS,
  ): Promise<Product[]> {
    const data = await productApi.list({ fields }, SILENT);
    return transformProducts(data?.items);
  }
  async function readCategories(): Promise<Category[]> {
    const data = await productApi.category.list(undefined, SILENT);
    return transformCategories(data?.items) as Category[];
  }
  async function readBrands(): Promise<Brand[]> {
    const data = await productApi.brand.list(undefined, SILENT);
    return transformBrands(data?.items) as Brand[];
  }

  async function fetchProducts(
    fields: ProductFieldsFilter[] = DEFAULT_PRODUCT_FIELDS,
  ): Promise<Product[]> {
    products.value = await readProducts(fields);
    return products.value;
  }

  async function fetchCategories(): Promise<Category[]> {
    categories.value = await readCategories();
    return categories.value;
  }

  async function fetchBrands(): Promise<Brand[]> {
    brands.value = await readBrands();
    return brands.value;
  }

  let loading: Promise<void> | null = null;
  // Bumped by reset(): a load that started before a logout must not write the
  // previous account's data back or mark the store initialized.
  let generation = 0;

  function init(): Promise<void> {
    if (initialized.value) return Promise.resolve();
    loading ??= load().finally(() => {
      loading = null;
    });
    return loading;
  }

  async function load(): Promise<void> {
    const started = generation;
    const [productsResult, categoriesResult, brandsResult] =
      await Promise.allSettled([
        readProducts(),
        readCategories(),
        readBrands(),
      ]);
    if (started !== generation) return;

    if (productsResult.status === 'fulfilled')
      products.value = productsResult.value;
    if (categoriesResult.status === 'fulfilled')
      categories.value = categoriesResult.value;
    if (brandsResult.status === 'fulfilled') brands.value = brandsResult.value;

    const results = [
      ['products', productsResult],
      ['categories', categoriesResult],
      ['brands', brandsResult],
    ] as const;
    ready.value = results.every(([, result]) => result.status === 'fulfilled');
    for (const [name, result] of results) {
      if (result.status === 'rejected')
        geinsLogWarn(
          `failed to fetch ${name} for the products store:`,
          result.reason,
        );
    }
    initialized.value = true;
  }

  function reset(): void {
    generation++;
    loading = null;
    products.value = [];
    categories.value = [];
    brands.value = [];
    ready.value = false;
    initialized.value = false;
  }

  function getCategoryName(id: string): string {
    return getEntityNameById(id, categories.value);
  }

  function getBrandName(id: string): string {
    return getEntityNameById(id, brands.value);
  }

  function transformProducts(products: Product[]): Product[] {
    if (!products) return [];
    return products.map((product) => ({
      ...product.localizations?.[currentLanguage.value],
      ...product,
      thumbnail: getProductThumbnail(product.media?.[0]?._id),
    }));
  }

  function transformCategories(categories: Category[]): Category[] {
    if (!categories) return [];
    return categories.map((category) => ({
      ...category.localizations[currentLanguage.value],
      ...category,
    }));
  }

  function transformBrands(brands: Brand[]): Brand[] {
    if (!brands) return [];
    return brands.map((brand) => ({
      ...brand.localizations[currentLanguage.value],
      ...brand,
    }));
  }

  return {
    products,
    categories,
    brands,
    ready,
    initialized,
    fetchProducts,
    fetchCategories,
    fetchBrands,
    init,
    reset,
    getCategoryName,
    getBrandName,
    transformProducts,
  };
});
