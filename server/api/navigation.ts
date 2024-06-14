import type { NavigationItem } from '@/model/NavigationItem';

export default defineEventHandler(async (event) => {
  const navigation = await $fetch<NavigationItem[]>(
    'http://localhost:1111/navigation',
  );

  return navigation;
});
