import type {
  PriceListProduct,
  PriceListProductList,
  PriceListRule,
  ProductPriceList,
  PriceListRuleField,
} from '#shared/types';

interface UsePriceListProductsReturnType {
  transformProductsForList: (
    priceListProducts: PriceListProduct[],
    entityData: ProductPriceListUpdate,
  ) => PriceListProductList[];
  getVolumePricing: (
    productId: string,
    products: PriceListProduct[],
    entityData: ProductPriceList,
  ) => PriceListRule[];
  getPriceListProduct: (
    productId: string,
    value: number | null,
    valueType: PriceListRuleField | undefined,
    quantity?: number,
  ) => PriceListProduct;
  addToPriceListProducts: (
    product: PriceListProduct,
    priceListProducts: PriceListProduct[],
  ) => void;
  getNewPriceListProducts: (
    newProducts: PriceListProduct[],
    currentProducts: PriceListProduct[],
    productId: string,
  ) => PriceListProduct[];
  convertPriceModeToRuleField: (
    priceMode?: PriceListPriceMode,
  ) => PriceListRuleField | undefined;
}

/**
 * Composable for managing price list products and transformations.
 *
 * Provides utilities for transforming price list products between different formats,
 * managing volume pricing, and handling product pricing rules and modes.
 *
 * @returns {UsePriceListProductsReturnType} - An object containing price list product utilities
 * @property {function} transformProductsForList - Transforms price list products to list format
 * @property {function} getVolumePricing - Extracts volume pricing for a specific product
 * @property {function} getPriceListProduct - Creates a price list product object
 * @property {function} addToPriceListProducts - Adds or updates a product in the price list
 * @property {function} getNewPriceListProducts - Merges new products with existing ones
 * @property {function} convertPriceModeToRuleField - Converts price mode to rule field type
 */
export const usePriceListProducts = (): UsePriceListProductsReturnType => {
  const { convertToPrice } = usePrice();
  const { getProductThumbnail } = useGeinsImage();

  const transformProductsForList = (
    priceListProducts: PriceListProduct[] = [],
    entityData: ProductPriceListUpdate,
  ): PriceListProductList[] => {
    return priceListProducts
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
          volumePricing: getVolumePricing(product.productId, priceListProducts),
          priceMode: product.priceMode || 'auto',
        };
      });
  };

  const getVolumePricing = (
    productId: string,
    products: PriceListProduct[],
  ): PriceListRule[] => {
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

  const getPriceListProduct = (
    productId: string,
    value: number | null,
    valueType: PriceListRuleField | undefined,
    quantity: number = 1,
  ): PriceListProduct => {
    return {
      productId,
      ...(valueType === 'price' && value !== null && { price: value }),
      ...(valueType === 'margin' && value !== null && { margin: value }),
      ...(valueType === 'discountPercent' &&
        value !== null && { discountPercent: value }),
      staggeredCount: quantity,
    };
  };

  const addToPriceListProducts = (
    product: PriceListProduct,
    priceListProducts: PriceListProduct[],
  ): void => {
    const existingIndex = priceListProducts.findIndex(
      (p) =>
        p.productId === product.productId &&
        p.staggeredCount === product.staggeredCount,
    );
    if (existingIndex >= 0) {
      priceListProducts[existingIndex] = product;
    } else {
      priceListProducts.push(product);
    }
  };

  const getNewPriceListProducts = (
    newProducts: PriceListProduct[],
    currentProducts: PriceListProduct[],
    productId: string,
  ): PriceListProduct[] => {
    // Create a map of newProducts for quick lookup by staggeredCount
    const newProductsMap = new Map<number, PriceListProduct>();
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
    priceMode?: PriceListPriceMode,
  ): PriceListRuleField | undefined => {
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
    getVolumePricing,
    getPriceListProduct,
    addToPriceListProducts,
    getNewPriceListProducts,
    convertPriceModeToRuleField,
  };
};
