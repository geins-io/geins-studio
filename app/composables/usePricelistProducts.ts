import type {
  Product,
  PricelistProduct,
  PricelistProductList,
  PricelistRule,
  ProductPricelist,
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
          manual: false,
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
      }));
    console.log('🚀 ~ getQuantityLevels ~ productLevels:', productLevels);

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
    // const productQuantities = new Set(
    //   productLevels.map((level) => level.quantity),
    // );

    // entityLevels?.forEach((entityLevel: PricelistRule) => {
    //   if (
    //     entityLevel.quantity !== undefined &&
    //     !productQuantities.has(entityLevel.quantity)
    //   ) {
    //     mergedLevels.push(entityLevel);
    //   }
    // });

    return mergedLevels.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
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
      margin: Number(product.margin || 0),
      discount: Number(product.discount || 0),
      staggeredCount: 1,
    }));

    // selectedProducts.forEach((product) => {
    //   if (product.quantityLevels) {
    //     product.quantityLevels.forEach((level) => {
    //       if (
    //         !level.global &&
    //         level.quantity !== undefined &&
    //         level.quantity > 1
    //       ) {
    //         products.push({
    //           productId: product._id,
    //           price: Number(level.price),
    //           margin: Number(level.margin || 0),
    //           discount: Number(level.discountPercent || 0),
    //           staggeredCount: level.quantity,
    //         });
    //       }
    //     });
    //   }
    // });

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
          margin: product.margin,
          discountPercent: product.discount,
          staggeredCount: product.staggeredCount,
        };
      } else {
        updatedProducts.push(product);
      }
    });

    return updatedProducts;
  };

  const getPricelistProduct = (
    productId: string,
    value: number,
    valueType: 'discountPercent' | 'margin' | 'price',
    quantity: number = 1,
  ): PricelistProduct => {
    return {
      productId,
      ...(valueType === 'price' && { price: value }),
      ...(valueType === 'margin' && { margin: value }),
      ...(valueType === 'discountPercent' && { discountPercent: value }),
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

  return {
    transformProductsForList,
    getQuantityLevels,
    getPricelistProducts,
    getPricelistProduct,
    addToPricelistProducts,
  };
};
