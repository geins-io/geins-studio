export const usePrice = () => {
  const convertToPrice = (price: string | number, currency: string): Price => {
    return {
      price: String(price),
      currency,
    };
  };

  return {
    convertToPrice,
  };
};
