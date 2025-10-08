interface UsePriceReturnType {
  convertToPrice: (
    price: string | number | undefined,
    currency: string,
    placeholder?: string | number,
  ) => Price;
}

/**
 * Composable for price conversion and formatting utilities.
 *
 * Provides functions to convert various price formats into standardized
 * Price objects with proper currency and placeholder handling.
 *
 * @returns {UsePriceReturnType} - An object containing price utility functions
 * @property {function} convertToPrice - Converts price data to Price object with currency and placeholder
 */
export const usePrice = (): UsePriceReturnType => {
  const convertToPrice = (
    price: string | number | undefined,
    currency: string,
    placeholder?: string | number,
  ): Price => {
    return {
      price: price ? String(price) : undefined,
      currency,
      placeholder: placeholder ? String(placeholder) : undefined,
    };
  };

  return {
    convertToPrice,
  };
};
