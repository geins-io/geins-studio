import { products } from './mockdata/products';
import { categories } from './mockdata/categories';
import { navigation } from './mockdata/navigation';

const mockData = {
  // Products
  async products(limit: number, offset: number) {
    return products.slice(offset, offset + limit);
  },
  async productsFromCategory(
    categoryId: number,
    limit: number,
    offset: number,
  ) {
    return products
      .filter((product) => {
        return product.categories.some(
          (category) => category.id === categoryId,
        );
      })
      .slice(offset, offset + limit);
  },

  // Categories
  async categories(limit: number, offset: number) {
    return categories.slice(offset, offset + limit);
  },

  // Navigation
  async navigation() {
    return navigation;
  },
};

export default mockData;
