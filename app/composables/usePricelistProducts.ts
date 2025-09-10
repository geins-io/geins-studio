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
      .filter((p) => p.productId === productId && p.staggeredCount > 1)
      .map((p) => ({
        quantity: p.staggeredCount,
        price: p.price,
        margin: p.margin,
        discountPercent: p.discountPercent,
        global: false,
        lastFieldChanged: convertPriceModeToRuleField(p.priceMode),
      }));

    const entityLevels = entityData.rules
      ?.filter(
        (rule: PricelistRule) =>
          rule.quantity !== undefined && rule.quantity !== 1,
      ) // Filter out quantity 1 and undefined rules
      ?.map((rule: PricelistRule) => ({
        quantity: rule.quantity!,
        margin: rule.margin,
        discountPercent: rule.discountPercent,
        price: rule.price,
        global: true,
      }));

    const mergedLevels: PricelistRule[] = [
      ...productLevels,
      ...(entityLevels || []),
    ];

    return mergedLevels.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
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
  ): PricelistProduct[] => {
    const updatedProducts = [...currentProducts];

    newProducts.forEach((newProduct) => {
      addToPricelistProducts(newProduct, updatedProducts);
    });

    return updatedProducts;
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
