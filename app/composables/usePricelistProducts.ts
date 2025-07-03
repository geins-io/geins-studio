import type {
  Product,
  PricelistProduct,
  PricelistProductList,
  PricelistRule,
  ProductPricelist,
} from '#shared/types';

export const usePricelistProducts = () => {
  const { convertToPrice } = usePrice();

  const transformProductsForList = (
    products: Product[],
    entityData: ProductPricelist,
  ): PricelistProductList[] => {
    const pricelistProducts: PricelistProduct[] = entityData?.products || [];

    return products.map((product) => {
      const regularPriceExVat = product.defaultPrice?.regularPriceIncVat
        ? product.defaultPrice.regularPriceIncVat /
          (1 + (product.defaultPrice.vatRate || 0))
        : 0;
      const regularPrice = entityData?.exVat
        ? Math.round(regularPriceExVat * 100) / 100
        : product.defaultPrice?.regularPriceIncVat || 0;

      const listPrice =
        entityData?.products?.find(
          (p: PricelistProduct) => p.productId === product._id,
        )?.price || undefined;

      return {
        _id: product._id,
        name: product.name,
        thumbnail: product.thumbnail || '',
        purchasePrice: convertToPrice(
          product.purchasePrice,
          product.purchasePriceCurrency,
        ),
        regularPrice: convertToPrice(regularPrice, entityData?.currency),
        listPrice: convertToPrice(
          listPrice,
          entityData?.currency,
          listPrice ?? regularPrice,
        ),
        discount: 0,
        margin: 0,
        quantityLevels: getQuantityLevels(
          pricelistProducts,
          product,
          entityData,
        ),
        manual: false,
      };
    });
  };

  const getQuantityLevels = (
    products: PricelistProduct[],
    product: Product,
    entityData: ProductPricelist,
  ): PricelistRule[] => {
    const productLevels = products
      .filter((p) => p.productId === product._id && p.staggeredCount > 1)
      .map((p) => ({
        quantity: p.staggeredCount,
        price: p.price,
      }));

    const entityLevels = entityData.rules?.map((rule: PricelistRule) => ({
      quantity: rule.quantity,
      price: rule.price,
      global: true,
    }));

    const mergedLevels: PricelistRule[] = [...productLevels];
    const productQuantities = new Set(
      productLevels.map((level) => level.quantity),
    );

    entityLevels?.forEach((entityLevel: PricelistRule) => {
      if (!productQuantities.has(entityLevel.quantity)) {
        mergedLevels.push(entityLevel);
      }
    });

    return mergedLevels.sort((a, b) => a.quantity - b.quantity);
  };

  const getPricelistProducts = (
    selectedProducts: PricelistProductList[],
    currentProducts: PricelistProduct[] = [],
  ): PricelistProduct[] => {
    const products = selectedProducts.map((product) => ({
      productId: product._id,
      price: Number(
        product.listPrice?.price || product.regularPrice?.price || 0,
      ),
      staggeredCount: 1,
    }));

    selectedProducts.forEach((product) => {
      if (product.quantityLevels) {
        product.quantityLevels.forEach((level) => {
          if (!level.global && level.quantity > 1) {
            products.push({
              productId: product._id,
              price: Number(level.price),
              staggeredCount: level.quantity,
            });
          }
        });
      }
    });

    const updatedProducts: PricelistProduct[] = [...currentProducts];

    products.forEach((product) => {
      const existingIndex = updatedProducts.findIndex(
        (p) =>
          p.productId === product.productId &&
          p.staggeredCount === product.staggeredCount,
      );
      if (existingIndex >= 0) {
        updatedProducts[existingIndex] = {
          _id: updatedProducts[existingIndex]?._id || undefined,
          productId: product.productId,
          price: product.price,
          staggeredCount: product.staggeredCount,
        };
      } else {
        updatedProducts.push(product);
      }
    });

    return updatedProducts;
  };

  const updatePricelistProductsPrice = (
    selectedProducts: PricelistProductList[],
    id: string,
    price: string,
  ) => {
    const product = selectedProducts.find((p) => p._id === id);
    if (product && product.listPrice) {
      product.listPrice.price = price;
    }
  };

  return {
    transformProductsForList,
    getQuantityLevels,
    getPricelistProducts,
    updatePricelistProductsPrice,
  };
};
