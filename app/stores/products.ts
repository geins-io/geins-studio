import { defineStore } from 'pinia';
import type { Product, Category, Brand } from '#shared/types';

export const useProductsStore = defineStore('products', () => {
  const { geinsLogError } = useGeinsLog('store/account.ts');
  const api = repository(useNuxtApp().$geinsApi);

  // STATE
  const products = ref<Product[]>([]);
  const categories = ref<Category[]>([]);
  const brands = ref<Brand[]>([]);
  const ready = ref(false);

  // ACTIONS
  async function fetchProducts(): Promise<Product[]> {
    const data = await api.product.list();
    products.value = data;
    return data;
  }

  async function fetchCategories(): Promise<Category[]> {
    const data = await api.category.list();
    categories.value = data;
    return data;
  }

  async function fetchBrands(): Promise<Brand[]> {
    const data = await api.brand.list();
    brands.value = data;
    return data;
  }

  async function init(): Promise<void> {
    const results = await Promise.allSettled([
      fetchProducts(),
      fetchCategories(),
      //fetchBrands(),
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
        geinsLogError(
          `Failed to fetch ${callName} for the products store: ${result.reason}`,
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
  };
});
