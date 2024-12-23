// SELECTOR

export type SelectorCondition = 'and' | 'or';
export type CompareCondition = 'lt' | 'gt' | 'eq';

export interface CurrencyField {
  [currency: string]: number;
}

export interface PriceSelection {
  condition: CompareCondition;
  values: CurrencyField;
}

export interface StockSelection {
  condition: CompareCondition;
  quantity: number;
}

export interface SelectorSelection {
  condition: SelectorCondition;
  categories?: Category[];
  brands?: Brand[];
  price?: PriceSelection[];
  stock?: StockSelection[];
  ids?: number[];
}

export interface SelectorSelectionGroup {
  condition?: SelectorCondition;
  selections: SelectorSelection[];
}

export interface SelectorSelectionBase {
  include?: SelectorSelectionGroup[];
  exclude?: SelectorSelectionGroup[];
}
