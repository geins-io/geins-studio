import { defineStore } from 'pinia';
import type { Product, Category, Brand } from '#shared/types';

/**
 * Products store — caches product, category, and brand data for cross-page use.
 *
 * Fetches and transforms product data from the API, providing thumbnail URLs
 * and localized names. Responds to language changes by re-fetching.
 *
 * Initialization: call `init()` once after authentication. The `geins-global.ts`
 * plugin handles this automatically.
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
  async function fetchProducts(
    fields: ProductFieldsFilter[] = ['localizations', 'media', 'prices'],
  ): Promise<Product[]> {
    const data = await productApi.list({ fields });
    products.value = transformProducts(data?.items);
    return products.value;
  }

  async function fetchCategories(): Promise<Category[]> {
    const data = await productApi.category.list();
    categories.value = transformCategories(data?.items) as Category[];
    return categories.value;
  }

  async function fetchBrands(): Promise<Brand[]> {
    const data = await productApi.brand.list();
    brands.value = transformBrands(data?.items) as Brand[];
    return brands.value;
  }

  async function init(): Promise<void> {
    if (initialized.value) return;
    const results = await Promise.allSettled([
      fetchProducts(),
      fetchCategories(),
      fetchBrands(),
    ]);
    ready.value = results.every(
      (result) => result.status === 'fulfilled' && result.value,
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected' || !result.value) {
        let callName = '';
        switch (index) {
          // case 0:
          //   callName = 'products';
          //   break;
          case 0:
            callName = 'categories';
            break;
          case 1:
            callName = 'brands';
            break;
        }
        geinsLogWarn(
          `failed to fetch ${callName} for the products store:`,
          (result as PromiseRejectedResult).reason,
        );
      }
    });
    initialized.value = true;
  }

  function reset(): void {
    products.value = [];
    categories.value = [];
    brands.value = [];
    ready.value = false;
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
