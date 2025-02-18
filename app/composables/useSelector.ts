import { SelectorCondition, CompareCondition } from '#shared/types';

export function useSelector() {
  const getFallbackSelection = (): SelectorSelection => {
    return structuredClone({
      condition: SelectorCondition.And,
      categoryIds: [],
      brandIds: [],
      price: [],
      stock: [],
      ids: [],
    });
  };

  const getEmptySelectionBase = (): SelectorSelectionBase => {
    return structuredClone({
      include: [
        {
          condition: SelectorCondition.And,
          selections: [getFallbackSelection()],
        },
      ],
      exclude: [
        {
          condition: SelectorCondition.And,
          selections: [getFallbackSelection()],
        },
      ],
    });
  };

  const convertToApiSelection = (
    selection: SelectorSelection,
  ): SelectorApiSelection => {
    return {
      condition: selection.condition,
      categoryIds: selection.categoryIds,
      brandIds: selection.brandIds,
      price: selection.price,
      stock: selection.stock,
      productIds: selection.ids || [],
    };
  };

  const convertToSimpleSelection = (
    selection: SelectorSelectionBase,
  ): SelectorSelectionBaseSimple => {
    const include = selection?.include?.[0]?.selections?.[0];
    const exclude = selection?.exclude?.[0]?.selections?.[0];
    const isApiSelections =
      include && exclude && 'productIds' in include && 'productIds' in exclude;
    return {
      include: isApiSelections ? include.productIds : include?.ids || [],
      exclude: isApiSelections ? exclude.productIds : exclude?.ids || [],
    };
  };

  const dummyData: SelectorSelectionBase = {
    include: [
      {
        selections: [
          {
            condition: SelectorCondition.And,
            categoryIds: [1, 2, 3],
            brandIds: [1, 2],
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
            ids: [1, 2, 3],
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

  return {
    dummyData,
    getFallbackSelection,
    getEmptySelectionBase,
    convertToApiSelection,
    convertToSimpleSelection,
  };
}
