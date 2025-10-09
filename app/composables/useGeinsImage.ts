interface UseGeinsImageReturnType {
  getProductThumbnail: (slug?: string) => string;
}

/**
 * Composable for generating Geins image URLs and handling image operations.
 *
 * Provides utilities for creating product thumbnail URLs using the Geins commerce
 * services with proper account context and fallback handling.
 *
 * @returns {UseGeinsImageReturnType} - An object containing image utility functions
 * @property {function} getProductThumbnail - Generates product thumbnail URL or returns placeholder
 */
export const useGeinsImage = (): UseGeinsImageReturnType => {
  const accountStore = useAccountStore();
  const { account } = storeToRefs(accountStore);

  const getProductThumbnail = (slug?: string) => {
    if (!slug || !account.value?.name) return '/placeholder.svg';
    return `https://${account.value?.name}.commerce.services/product/100x100/${slug}`;
  };

  return {
    getProductThumbnail,
  };
};
