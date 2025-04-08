import { defineStore } from 'pinia';
import type { Product, Category, Brand } from '#shared/types';
export const useProductsStore = defineStore('products', () => {
  const { geinsLogWarn } = useGeinsLog('store/products.ts');
  const api = repository(useNuxtApp().$geinsApi);
  const accountStore = useAccountStore();
  const { currentLanguage } = storeToRefs(accountStore);

  // STATE
  const products = ref<Product[]>([]);
  const categories = ref<Category[]>([]);
  const brands = ref<Brand[]>([]);
  const ready = ref(false);

  // ACTIONS
  async function fetchProducts(): Promise<Product[]> {
    const data = await api.product.list.get('localizations,images,prices');
    products.value = transformProducts(data?.items) as Product[];
    return products.value;
  }

  async function fetchCategories(): Promise<Category[]> {
    const data = await api.category.list.get();
    categories.value = transformCategories(data?.items) as Category[];
    return categories.value;
  }

  async function fetchBrands(): Promise<Brand[]> {
    const data = await api.brand.list.get();
    brands.value = transformBrands(data?.items) as Brand[];
    return brands.value;
  }

  async function init(): Promise<void> {
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
          case 0:
            callName = 'products';
            break;
          case 1:
            callName = 'categories';
            break;
          case 2:
            callName = 'brands';
            break;
        }
        geinsLogWarn(
          `failed to fetch ${callName} for the products store:`,
          result.reason,
        );
      }
    });
  }

  function reset(): void {
    products.value = [];
    categories.value = [];
    brands.value = [];
    ready.value = false;
  }

  function getCategoryName(id: string): string {
    const category: Category | undefined = categories.value.find(
      (c) => c.id === id,
    );
    return category?.name || '';
  }

  function getBrandName(id: string): string {
    const brand: Brand | undefined = brands.value.find((b) => b.id === id);
    return brand?.name || '';
  }

  function transformProducts(products: Product[]): Product[] {
    if (!products) return [];
    return products.map((product) => ({
      ...product.localizations?.[currentLanguage.value],
      ...product,
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
