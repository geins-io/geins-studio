export const useGeinsImage = () => {
  const accountStore = useAccountStore();
  const { account } = storeToRefs(accountStore);

  const getProductThumbnail = (slug?: string) => {
    if (!slug) return '/placeholder.svg';
    return `https://${account.value?.name}.commerce.services/product/100x100/${slug}`;
  };

  return {
    getProductThumbnail,
  };
};
