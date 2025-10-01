import { defineStore } from 'pinia';

export const useBreadcrumbsStore = defineStore('breadcrumbs', () => {
  const showBreadcrumbs = ref(true);
  const currentTitle = ref<string>('');
  const currentParent = ref<{ title: string; link: string } | boolean>();

  const route = useRoute();
  watch(
    route,
    () => {
      showBreadcrumbs.value = route.path !== '/';
    },
    { deep: true },
  );

  const setCurrentTitle = (title: string) => {
    currentTitle.value = title;
  };

  const setCurrentParent = (parent?: { title: string; link: string }) => {
    currentParent.value = parent || false;
  };

  const setShowBreadcrumbs = (show: boolean) => {
    showBreadcrumbs.value = show;
  };

  return {
    showBreadcrumbs,
    currentTitle,
    currentParent,
    setCurrentTitle,
    setCurrentParent,
    setShowBreadcrumbs,
  };
});
