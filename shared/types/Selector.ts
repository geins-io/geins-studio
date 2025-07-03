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

export type SelectorSelectionSimple = string[];

export interface SelectorSelectionQuery {
  condition?: SelectorCondition;
  categoryIds?: string[];
  brandIds?: string[];
  price?: PriceSelection[];
  stock?: StockSelection[];
  productIds?: string[];
}

export interface SelectorSelectionInternal
  extends Omit<SelectorSelectionQuery, 'productIds'> {
  ids?: string[];
}

export interface SelectorSelectionGroup {
  condition?: SelectorCondition;
  selections: SelectorSelectionQuery[];
}

export interface SelectorSelectionQueryBase {
  include: SelectorSelectionGroup[];
  exclude: SelectorSelectionGroup[];
}

export interface SelectorSelectionInternalBase {
  include: SelectorSelectionInternal;
  exclude: SelectorSelectionInternal;
}

export interface SelectorSelectionSimpleBase {
  include: SelectorSelectionSimple;
  exclude: SelectorSelectionSimple;
}

export interface SelectorSelectionOption {
  id: SelectorSelectionOptionsId;
  group: keyof SelectorSelectionInternal;
  label?: string;
}

export interface SelectorEntity extends EntityBaseWithName {
  image?: string;
  thumbnail?: string;
}
