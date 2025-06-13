export const usePrice = () => {
  const convertToPrice = (price: string, currency: string): Price => {
    return {
      price,
      currency,
    };
  };

  return {
    convertToPrice,
  };
};
