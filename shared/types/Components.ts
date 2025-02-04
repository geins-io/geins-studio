// SELECTOR
export const enum CompareCondition {
  LessThan = 'lt',
  GreaterThan = 'gt',
  Equal = 'eq',
}
export const enum SelectorCondition {
  And = 'and',
  Or = 'or',
}
export type SelectorMode = 'simple' | 'advanced';
export type SelectorSelectionType = 'include' | 'exclude';
export type SelectorSelectionStrategy = 'all' | 'none';
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
  include: SelectorSelectionGroup[];
  exclude: SelectorSelectionGroup[];
}

export interface SelectorSelectionOption {
  id: SelectorSelectionOptionsId;
  group: keyof SelectorSelection;
  type: 'single' | 'multiple'; // TODO: evaluate if this is needed
  label?: string;
}

export interface Entity {
  id: number;
  name?: string;
  title?: string;
  image?: string;
}
