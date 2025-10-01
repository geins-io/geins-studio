import type {
  Product,
  PricelistProduct,
  PricelistProductList,
  PricelistRule,
  ProductPricelist,
  PricelistRuleField,
} from '#shared/types';

export const usePricelistProducts = () => {
  const { convertToPrice } = usePrice();
  const { getProductThumbnail } = useGeinsImage();

  const transformProductsForList = (
    pricelistProducts: PricelistProduct[] = [],
    entityData: ProductPricelist,
  ): PricelistProductList[] => {
    return pricelistProducts
      .filter((p) => p.staggeredCount === 1)
      .map((product) => {
        return {
          _id: product.productId,
          name: product.name || '',
          thumbnail: getProductThumbnail(product.thumbnail),
          purchasePrice: convertToPrice(
            product.purchasePrice,
            product.purchasePriceCurrency || '',
          ),
          regularPrice: convertToPrice(
            product.regularPrice,
            entityData?.currency || '',
          ),
          listPrice: convertToPrice(
            product.price,
            entityData?.currency || '',
            product.price,
          ),
          discount: product.discountPercent || 0,
          margin: product.margin || 0,
          quantityLevels: getQuantityLevels(
            product.productId,
            pricelistProducts,
            entityData,
          ),
          priceMode: product.priceMode || 'auto',
        };
      });
  };

  const getQuantityLevels = (
    productId: string,
    products: PricelistProduct[],
    entityData: ProductPricelist,
  ): PricelistRule[] => {
    const productLevels = products
      .filter(
        (p) =>
          p.productId === productId &&
          p.staggeredCount > 1 &&
          p.priceMode !== 'auto',
      )
      .map((p) => ({
        quantity: p.staggeredCount,
        price: p.price,
        margin: p.margin,
        discountPercent: p.discountPercent,
        global: p.priceMode === 'autoRule',
        lastFieldChanged: convertPriceModeToRuleField(p.priceMode),
      }));

    return productLevels.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
  };

  const getPricelistProduct = (
    productId: string,
    value: number | null,
    valueType: PricelistRuleField | undefined,
    quantity: number = 1,
  ): PricelistProduct => {
    return {
      productId,
      ...(valueType === 'price' && value !== null && { price: value }),
      ...(valueType === 'margin' && value !== null && { margin: value }),
      ...(valueType === 'discountPercent' &&
        value !== null && { discountPercent: value }),
      staggeredCount: quantity,
    };
  };

  const addToPricelistProducts = (
    product: PricelistProduct,
    pricelistProducts: PricelistProduct[],
  ): void => {
    const existingIndex = pricelistProducts.findIndex(
      (p) =>
        p.productId === product.productId &&
        p.staggeredCount === product.staggeredCount,
    );
    if (existingIndex >= 0) {
      pricelistProducts[existingIndex] = product;
    } else {
      pricelistProducts.push(product);
    }
  };

  const getNewPricelistProducts = (
    newProducts: PricelistProduct[],
    currentProducts: PricelistProduct[],
    productId: string,
  ): PricelistProduct[] => {
    // Create a map of newProducts for quick lookup by staggeredCount
    const newProductsMap = new Map<number, PricelistProduct>();
    newProducts.forEach((product) => {
      newProductsMap.set(product.staggeredCount, product);
    });

    // Filter currentProducts to only the target productId
    const matchingProducts = currentProducts.filter(
      (product) =>
        product.productId === productId && product.staggeredCount > 1,
    );

    // Process matching products: update if exists in newProducts, strip if not
    const processedProducts = matchingProducts.map((currentProduct) => {
      const newProduct = newProductsMap.get(currentProduct.staggeredCount);

      if (newProduct) {
        return newProduct;
      } else {
        return {
          productId: currentProduct.productId,
          staggeredCount: currentProduct.staggeredCount,
          delete: true,
        };
      }
    });

    // Add any newProducts that weren't in currentProducts
    newProducts.forEach((newProduct) => {
      const existsInCurrent = matchingProducts.some(
        (current) => current.staggeredCount === newProduct.staggeredCount,
      );

      if (!existsInCurrent) {
        processedProducts.push(newProduct);
      }
    });

    // Return all untouched products plus processed ones
    return [
      ...currentProducts.filter(
        (product) =>
          product.productId !== productId || product.staggeredCount === 1,
      ),
      ...processedProducts,
    ];
  };

  const convertPriceModeToRuleField = (
    priceMode?: PricelistPriceMode,
  ): PricelistRuleField | undefined => {
    switch (priceMode) {
      case 'margin':
        return 'margin';
      case 'discount':
        return 'discountPercent';
      case 'fixed':
        return 'price';
      default:
        return undefined;
    }
  };

  return {
    transformProductsForList,
    getQuantityLevels,
    getPricelistProduct,
    addToPricelistProducts,
    getNewPricelistProducts,
    convertPriceModeToRuleField,
  };
};
