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
export const enum SelectorMode {
  Simple = 'simple',
  Advanced = 'advanced',
}
export const enum SelectorSelectionType {
  Include = 'include',
  Exclude = 'exclude',
}
export const enum SelectorSelectionStrategy {
  All = 'all',
  None = 'none',
}
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
