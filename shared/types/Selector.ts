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

export type SelectorSelectionSimple = number[];

export interface SelectorSelection {
  condition: SelectorCondition;
  categoryIds: number[];
  brandIds: number[];
  price: PriceSelection[];
  stock: StockSelection[];
  ids?: SelectorSelectionSimple;
}

export interface SelectorApiSelection extends SelectorSelection {
  productIds: number[];
}

export interface SelectorSelectionGroup {
  condition?: SelectorCondition;
  selections: SelectorSelection[] | SelectorApiSelection[];
}

export interface SelectorSelectionBase {
  include: SelectorSelectionGroup[];
  exclude: SelectorSelectionGroup[];
}

export interface SelectorSelectionBaseSimple {
  include: SelectorSelectionSimple;
  exclude: SelectorSelectionSimple;
}

export interface SelectorSelectionOption {
  id: SelectorSelectionOptionsId;
  group: keyof SelectorSelection;
  label?: string;
}

export interface SelectorEntity {
  id: number;
  name?: string;
  image?: string;
}
