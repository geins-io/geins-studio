import type { ProductPriceList } from './index';

// Pricing types - wrapping ProductPriceList with additional fields
export interface CustomerPriceList
  extends Omit<
    ProductPriceList,
    | 'products'
    | 'rules'
    | 'productSelectionQuery'
    | 'autoAddProducts'
    | 'forced'
    | 'dateCreated'
  > {
  productCount: number;
}
