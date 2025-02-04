import { SelectorCondition, CompareCondition } from '#shared/types';

export function useSelector() {
  const getFallbackSelection = (): SelectorSelection => {
    return structuredClone({
      condition: SelectorCondition.And,
      categories: [],
      brands: [],
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

  const dummyData: SelectorSelectionBase = {
    include: [
      {
        condition: SelectorCondition.And,
        selections: [
          {
            condition: SelectorCondition.And,
            categories: [
              { id: 1, name: 'Electronics' },
              { id: 2, name: 'Clothing' },
              { id: 3, name: 'Shoes' },
            ],
            brands: [
              { id: 1, name: 'BrandA' },
              { id: 2, name: 'BrandB' },
            ],
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
  };
}
