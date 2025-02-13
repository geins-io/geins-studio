import { defineStore } from 'pinia';
import type { Product, Category, Brand } from '#shared/types';
export const useProductsStore = defineStore('products', () => {
  const { geinsLogWarn } = useGeinsLog('store/products.ts');
  const api = repository(useNuxtApp().$geinsApi);
  const { currentLanguage } = useAccountStore();

  // STATE
  const products = ref<Product[]>([]);
  const categories = ref<Category[]>([]);
  const brands = ref<Brand[]>([]);
  const ready = ref(false);

  // ACTIONS
  async function fetchProducts(): Promise<Product[]> {
    const data = await api.product.list.get();
    products.value = data?.items || [];
    return data?.items || [];
  }

  async function fetchCategories(): Promise<Category[]> {
    const data = await api.category.list.get();
    categories.value = data?.items || [];
    return data?.items || [];
  }

  async function fetchBrands(): Promise<Brand[]> {
    const data = await api.brand.list.get();
    brands.value = data?.items || [];
    return data?.items || [];
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

  function getCategoryName(categoryId: number): string {
    const category: Category | undefined = categories.value.find(
      (c) => c.categoryId === categoryId,
    );
    const text = category?.texts.find((t) => t.language === currentLanguage);
    return text?.name || '';
  }

  function getBrandName(brandId: number): string {
    const brand: Brand | undefined = brands.value.find(
      (b) => b.brandId === brandId,
    );
    const text = brand?.texts.find((t) => t.language === currentLanguage);
    return text?.name || '';
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
  };
});
