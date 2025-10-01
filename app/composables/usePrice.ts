export const usePrice = () => {
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
