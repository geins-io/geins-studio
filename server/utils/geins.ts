import mockData from '@/lib/mockData';

/* MOCK DATA IS TO BE REPLACED WITH REAL API CALLS */

export const geins = {
  // Products
  products: {
    list: async (limit: number, offset: number) => {
      return mockData.products(limit, offset);
    },
    listFromCategory: async (
      categoryId: number,
      limit: number,
      offset: number,
    ) => {
      return mockData.productsFromCategory(categoryId, limit, offset);
    },
  },
  // Categories
  categories: {
    list: async (limit: number, offset: number) => {
      return mockData.categories(limit, offset);
    },
  },
  merchantCenter: {
    navigation: async (userTypeId: number) => {
      return mockData.navigation();
    },
  },
};
