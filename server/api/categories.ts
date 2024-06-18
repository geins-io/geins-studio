import type { Category } from '@/model/product/Category';

export default defineEventHandler(async () => {
  const categories = await $fetch<Category[]>(
    'http://localhost:1111/categories',
  );

  return categories;
});
