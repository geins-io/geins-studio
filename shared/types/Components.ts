// SELECTOR
export interface SelectorSelection {
  condition: 'and' | 'or';
  categories?: Array<Category>;
  brands?: Array<{ name: string }>;
  price?: Array<{ condition: string; prices: number[] }>;
  stock?: Array<{ condition: string; stock: number }>;
  ids?: number[];
}
