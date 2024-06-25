import type { NavigationItem } from '@/types/NavigationItem';

export default defineEventHandler(async () => {
  const navigation = await $fetch<NavigationItem[]>(
    'http://localhost:1111/navigation',
  );

  return navigation;
});
