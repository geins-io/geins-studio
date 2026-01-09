import {
  SelectorCondition,
  CompareCondition,
  type SelectorSelectionInternalBase,
} from '#shared/types';

interface UseSelectorReturnType {
  dummyData: SelectorSelectionQueryBase;
  getFallbackSelection: () => SelectorSelectionInternal;
  getEmptyInternalSelectionBase: () => SelectorSelectionInternalBase;
  getEmptyQuerySelectionBase: () => SelectorSelectionQueryBase;
  getEmptySimpleSelectionBase: () => SelectorSelectionSimpleBase;
  convertToInternalSelection: (
    selections: SelectorSelectionQuery[],
  ) => SelectorSelectionInternal;
  convertToInternalSelectionBase: (
    selection: SelectorSelectionQueryBase,
  ) => SelectorSelectionInternalBase;
  convertToQuerySelection: (
    selection: SelectorSelectionInternal,
  ) => SelectorSelectionQuery[];
  convertToQuerySelectionBase: (
    selection: SelectorSelectionInternalBase,
  ) => SelectorSelectionQueryBase;
  convertSimpleToInternalSelectionBase: (
    selection: SelectorSelectionSimpleBase,
  ) => SelectorSelectionInternalBase;
  convertToSimpleSelection: (
    selection: SelectorSelectionInternal,
  ) => SelectorSelectionSimple;
  convertToSimpleSelectionBase: (
    selection: SelectorSelectionQueryBase,
  ) => SelectorSelectionSimpleBase;
  transformProductsToSelectorEntities: (
    products: Product[],
    idPrefix?: string,
  ) => SelectorEntity[];
}

/**
 * Composable for managing product selector state and transformations.
 *
 * Provides utilities for converting between different selector formats,
 * creating empty selections, and handling complex product selection logic
 * with include/exclude conditions and various criteria.
 *
 * @returns {UseSelectorReturnType} - An object containing selector utilities and transformations
 * @property {object} dummyData - Sample selector data for testing and development
 * @property {function} getFallbackSelection - Creates a fallback selection with default values
 * @property {function} getEmptyInternalSelectionBase - Creates empty internal selection base
 * @property {function} getEmptyQuerySelectionBase - Creates empty query selection base
 * @property {function} getEmptySimpleSelectionBase - Creates empty simple selection base
 * @property {function} convertToInternalSelection - Converts query selections to internal format
 * @property {function} convertToInternalSelectionBase - Converts query base to internal base
 * @property {function} convertToQuerySelection - Converts internal selection to query format
 * @property {function} convertToQuerySelectionBase - Converts internal base to query base
 * @property {function} convertSimpleToInternalSelectionBase - Converts simple to internal base
 * @property {function} convertToSimpleSelection - Converts internal to simple selection
 * @property {function} convertToSimpleSelectionBase - Converts query base to simple base
 */
export const useSelector = (): UseSelectorReturnType => {
  const { getProductThumbnail } = useGeinsImage();

  const getFallbackSelection = (): SelectorSelectionInternal => {
    return structuredClone({
      condition: SelectorCondition.And,
      categoryIds: [],
      brandIds: [],
      // price: [],
      // stock: [],
      ids: [],
    });
  };

  const getEmptyInternalSelectionBase = (): SelectorSelectionInternalBase => {
    return structuredClone({
      include: getFallbackSelection(),
      exclude: getFallbackSelection(),
    });
  };

  const getEmptyQuerySelectionBase = (): SelectorSelectionQueryBase => {
    return structuredClone({
      include: [
        {
          selections: [getFallbackSelection()],
        },
      ],

      exclude: [
        {
          selections: [getFallbackSelection()],
        },
      ],
    });
  };

  const getEmptySimpleSelectionBase = (): SelectorSelectionSimpleBase => {
    return structuredClone({
      include: [],
      exclude: [],
    });
  };

  const convertToInternalSelection = (
    selections: SelectorSelectionQuery[],
  ): SelectorSelectionInternal => {
    let selectorSelection: SelectorSelectionInternal = {};

    selections.forEach((selection, index) => {
      // Merge arrays instead of overwriting them
      selectorSelection = {
        // Only take condition from the first selection
        condition:
          index === 0
            ? selection.condition || SelectorCondition.And
            : selectorSelection.condition,
        ...selectorSelection,
        // Merge categoryIds arrays
        categoryIds: [
          ...(selectorSelection.categoryIds || []),
          ...(selection.categoryIds || []),
        ],
        // Merge brandIds arrays
        brandIds: [
          ...(selectorSelection.brandIds || []),
          ...(selection.brandIds || []),
        ],
        // Handle productIds -> ids conversion and merging
        ids: [
          ...(selectorSelection.ids || []),
          ...(selection.productIds || []),
        ],
      };
    });
    return selectorSelection;
  };

  const convertToInternalSelectionBase = (
    selection: SelectorSelectionQueryBase,
  ): SelectorSelectionInternalBase => {
    const createSelectionFromQuery = (
      querySelections: SelectorSelectionGroup[],
    ) => {
      const result = convertToInternalSelection(
        querySelections[0]?.selections || [],
      );
      return result;
    };

    const include = createSelectionFromQuery(selection.include || []);
    const exclude = createSelectionFromQuery(selection.exclude || []);

    return {
      include,
      exclude,
    };
  };

  const convertToQuerySelection = (
    selection: SelectorSelectionInternal,
  ): SelectorSelectionQuery[] => {
    return [
      {
        condition: selection.condition,
        categoryIds: selection.categoryIds,
        brandIds: selection.brandIds,
        // price: selection.price,
        // stock: selection.stock,
      },
      {
        productIds: selection.ids || [],
      },
    ];
  };

  const convertToQuerySelectionBase = (
    selection: SelectorSelectionInternalBase,
  ): SelectorSelectionQueryBase => {
    return {
      include: [
        {
          selections: convertToQuerySelection(selection.include),
        },
      ],
      exclude: [
        {
          selections: convertToQuerySelection(selection.exclude),
        },
      ],
    };
  };

  const convertSimpleToInternalSelectionBase = (
    selection: SelectorSelectionSimpleBase,
  ): SelectorSelectionInternalBase => {
    return {
      include: {
        condition: SelectorCondition.And,
        ids: selection.include,
      },
      exclude: {
        condition: SelectorCondition.And,
        ids: selection.exclude,
      },
    };
  };

  const convertToSimpleSelectionBase = (
    selection: SelectorSelectionQueryBase,
  ): SelectorSelectionSimpleBase => {
    const internalSelection = convertToInternalSelectionBase(selection);

    return {
      include: convertToSimpleSelection(internalSelection.include),
      exclude: convertToSimpleSelection(internalSelection.exclude),
    };
  };

  const convertToSimpleSelection = (
    selection: SelectorSelectionInternal,
  ): SelectorSelectionSimple => {
    return selection.ids || [];
  };

  const dummyData: SelectorSelectionQueryBase = {
    include: [
      {
        selections: [
          {
            condition: SelectorCondition.And,
            categoryIds: ['1', '2'],
            brandIds: ['1', '2'],
            price: [
              {
                condition: CompareCondition.LessThan,
                values: {
                  EUR: 90,
                  SEK: 850,
                },
              },
              {
                condition: CompareCondition.GreaterThan,
                values: {
                  EUR: 10,
                  SEK: 100,
                },
              },
            ],
            stock: [
              {
                condition: CompareCondition.GreaterThan,
                quantity: 10,
              },
              {
                condition: CompareCondition.LessThan,
                quantity: 1000,
              },
            ],
            productIds: ['1', '2', '3'],
          },
        ],
      },
    ],
    exclude: [
      {
        condition: SelectorCondition.Or,
        selections: [getFallbackSelection()],
      },
    ],
  };

  /**
   * Memoization cache for transformed products
   * Using WeakMap to allow garbage collection when product arrays are no longer referenced
   */
  const transformCache = new WeakMap<Product[], SelectorEntity[]>();

  /**
   * Transforms products with SKUs into SelectorEntity format for hierarchical selection.
   * Products with a single SKU are collapsed into one selectable row,
   * while products with multiple SKUs can be expanded.
   *
   * Results are memoized to avoid repeated transformations of the same product array.
   *
   * @param products - Array of Product objects with SKUs
   * @param idPrefix - Prefix for parent product IDs (default: 'p-')
   * @returns Array of SelectorEntity objects with nested SKU structure
   */
  const transformProductsToSelectorEntities = (
    products: Product[],
    idPrefix: string = 'p-',
  ): SelectorEntity[] => {
    // Check cache first
    const cached = transformCache.get(products);
    if (cached) {
      return cached;
    }

    // Transform products
    const result = products.map((product) => {
      const hasMultipleSkus = Number(product.skus?.length) > 1;
      const firstSkuId = product.skus?.[0]?._id || product._id;

      return {
        _id: hasMultipleSkus ? `${idPrefix}${product._id}` : firstSkuId,
        name: product.name,
        thumbnail: getProductThumbnail(product.media?.[0]?._id),
        productId: product._id,
        articleNumber: product.articleNumber,
        isCollapsed: !hasMultipleSkus,
        skus: hasMultipleSkus
          ? product.skus?.map((sku) => ({
              _id: sku._id,
              name: sku.name,
              articleNumber: sku.articleNumber,
              thumbnail: getProductThumbnail(product.media?.[0]?._id),
              productId: product._id,
              isCollapsed: false,
            }))
          : undefined,
      };
    });

    // Cache the result
    transformCache.set(products, result);
    return result;
  };

  return {
    dummyData,
    getFallbackSelection,
    getEmptyInternalSelectionBase,
    getEmptyQuerySelectionBase,
    getEmptySimpleSelectionBase,
    convertToInternalSelection,
    convertToInternalSelectionBase,
    convertToQuerySelection,
    convertToQuerySelectionBase,
    convertSimpleToInternalSelectionBase,
    convertToSimpleSelection,
    convertToSimpleSelectionBase,
    transformProductsToSelectorEntities,
  };
};
