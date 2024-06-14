import type { Product } from '@/model/product/Product';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const products = await $fetch<Product[]>('http://localhost:1111/products', {
    query,
  });

  return products;
});
