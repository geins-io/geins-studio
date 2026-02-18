const PLACEHOLDER_SRC = '/placeholder.svg';

interface UseGeinsImageReturnType {
  getProductThumbnail: (slug?: string) => string;
  handleImageError: (event: Event) => void;
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
    if (!slug || !account.value?.name) return PLACEHOLDER_SRC;
    return `https://${account.value?.name}.commerce.services/product/100x100/${slug}`;
  };

  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement;
    if (img.src !== new URL(PLACEHOLDER_SRC, window.location.origin).href) {
      img.src = PLACEHOLDER_SRC;
    }
  };

  return {
    getProductThumbnail,
    handleImageError,
  };
};
