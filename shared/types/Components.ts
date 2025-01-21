// SELECTOR

export type SelectorCondition = 'and' | 'or';
export type CompareCondition = 'lt' | 'gt' | 'eq';
export type SelectorSelectionType = 'include' | 'exclude';
export type SelectorMode = 'simple' | 'advanced';
export type SelectorSelectionOptionsId =
  | 'entity'
  | 'product'
  | 'category'
  | 'brand'
  | 'price'
  | 'stock'
  | 'import';

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

export interface SelectorSelectionOption {
  id: SelectorSelectionOptionsId;
  group: keyof SelectorSelection;
  type: 'single' | 'multiple';
  label?: string;
}

export interface Entity {
  id: number;
  name?: string;
  title?: string;
  image?: string;
}
