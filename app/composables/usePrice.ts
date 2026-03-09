interface UsePriceReturnType {
  convertToPrice: (
    price: string | number | undefined,
    currency: string,
    placeholder?: string | number,
  ) => Price;
  formatCurrency: (value: string | number | undefined | null) => string;
}

const wholeFormatter = new Intl.NumberFormat('sv-SE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const decimalFormatter = new Intl.NumberFormat('sv-SE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Composable for price conversion and formatting utilities.
 *
 * Provides functions to convert various price formats into standardized
 * Price objects with proper currency and placeholder handling.
 *
 * @returns {UsePriceReturnType} - An object containing price utility functions
 * @property {function} convertToPrice - Converts price data to Price object with currency and placeholder
 * @property {function} formatCurrency - Formats a numeric value with locale-aware thousands separators and 2 decimal places
 */
export const usePrice = (): UsePriceReturnType => {

  const formatCurrency = (
    value: string | number | undefined | null,
  ): string => {
    if (value === undefined || value === null || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);
    return Number.isInteger(num)
      ? wholeFormatter.format(num)
      : decimalFormatter.format(num);
  };

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
    formatCurrency,
  };
};
