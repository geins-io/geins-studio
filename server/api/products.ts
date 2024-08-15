import type { Product } from '@/types/product/Product';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const products: Product[] = [];
  await fetch(`https://fakestoreapi.com/products?limit=${query.total}`)
    .then((res) => res.json())
    .then((json) => {
      // rename the keys to match the Product interface
      json.forEach((product: any) => {
        products.push({
          id: product.id,
          name: product.title,
          price: product.price,
          description: product.description,
          image: product.image,
        });
      });
    });
  /*
  const products = await $fetch<Product[]>('http://localhost:1111/products', {
    query,
  });
  */

  return products;
});
