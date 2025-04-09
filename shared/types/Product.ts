export interface Localizations {
  name: string;
  text1: string;
  text2: string;
  text3: string;
  slug: string;
}

export interface Sku extends GeinsEntity {
  articleNumber: string;
  name: string;
  shelf: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  gtin: string;
  dateCreated: string;
  dateUpdated: string;
  dateIncoming: string;
  active: boolean;
  externalSkuId: string;
  stock: number;
  stockOversellable: number;
  stockStatic: number;
  stockSellable: number;
}

export interface SalePrice {
  salePriceIncVat: number;
  salePriceExVat: number;
}

export interface CampaignPrice {
  campaignPriceIncVat: number;
  campaignPriceExVat: number;
  campaignId: string;
}

export interface PriceListPrice {
  priceIncVat: number;
  priceExVat: number;
  priceListId: number;
  priceListName: string;
  staggeredCount: number;
}

export interface ProductPrices {
  currency: string;
  sellingPriceIncVat: number;
  sellingPriceExVat: number;
  regularPriceIncVat: number;
  regularPriceExVat: number;
  vatRate: number;
  countries: string[];
  salePrice?: SalePrice;
  campaignPrice?: CampaignPrice;
  priceLists?: PriceListPrice[];
}

export interface Media extends GeinsEntity {
  filename: string;
  order: number;
  tags: string[];
}

export interface ProductCampaign extends GeinsEntity {
  campaignId: string;
  name: string;
}

export type ProductParameterType =
  | 'String'
  | 'Tags'
  | 'Single'
  | 'Multi'
  | 'Float'
  | 'DateTime';

export interface ProductParameterTexts {
  language: string;
  groupName: string;
  parameterName: string;
  value: string;
  slug: string;
}

export interface ProductParameter {
  groupId: number;
  parameterId: number;
  type: ProductParameterType;
  valueId: number;
  value: string;
  localizations: ProductParameterTexts[];
}

export interface RelatedProducts extends GeinsEntity {
  relationTypeId: number;
  relationTypeName: string;
  relatedProductIds: number[];
}

export interface VariantValues {
  groupId: number;
  groupKey: string;
  dimensions: string[];
  values: Record<string, string>;
}

export interface Localized<T> {
  [lang: string]: T;
}

export interface CurrencyConverted<T> {
  [currency: string]: T;
}

export interface Product extends GeinsEntity {
  productId: number;
  name: string;
  slug: string;
  articleNumber: string;
  dateCreated: string;
  dateUpdated: string;
  dateFirstAvailable: string;
  dateActivated: string;
  maxDiscountPercentage: number;
  active: boolean;
  purchasePrice: number;
  purchasePriceCurrency: string;
  brand: Brand;
  supplierId: number;
  freightClassId: number;
  intrastatCode: string;
  countryOfOrigin: string;
  externalProductId: string;
  mainCategoryId: number;
  localizations?: Localized<Localizations>;
  skus?: Sku[];
  sortOrder?: number;
  prices?: CurrencyConverted<ProductPrices>;
  categories?: Category[];
  channels?: string[];
  media?: Media[];
  campaigns?: ProductCampaign[];
  parameters?: ProductParameter[];
  relatedProducts?: RelatedProducts[];
  variantValues?: VariantValues;
}

export interface Brand extends GeinsEntity {
  active: boolean;
  name: string;
  localizations: Localized<Localizations>;
}

export interface Category extends GeinsEntity {
  name: string;
  parentCategoryId: number;
  hidden: boolean;
  active: boolean;
  order: number;
  localizations: Localized<Localizations>;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

export interface PriceListProduct {
  productId: number;
  priceIncVat: number;
  priceExVat: number;
  staggeredCount: number;
}

export interface PriceList extends GeinsEntity {
  priceListId: number;
  channel: number;
  identifier: string;
  name: string;
  dateCreated: string;
  active: boolean;
  products?: PriceListProduct[];
}
