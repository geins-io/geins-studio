export function useSelector() {
  const getFallbackSelection = (): SelectorSelection => {
    return structuredClone({
      condition: 'and',
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
          condition: 'and',
          selections: [getFallbackSelection()],
        },
      ],
      exclude: [
        {
          condition: 'and',
          selections: [getFallbackSelection()],
        },
      ],
    });
  };

  const dummyData: SelectorSelectionBase = {
    include: [
      {
        condition: 'and',
        selections: [
          {
            condition: 'and',
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
                condition: 'lt',
                values: {
                  EUR: 90,
                  SEK: 850,
                },
              },
              {
                condition: 'gt',
                values: {
                  EUR: 10,
                  SEK: 100,
                },
              },
            ],
            stock: [
              {
                condition: 'gt',
                quantity: 10,
              },
              {
                condition: 'lt',
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
        condition: 'or',
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
