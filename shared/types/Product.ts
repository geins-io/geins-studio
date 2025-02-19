export interface ProductTexts {
  language: string;
  name: string;
  text1: string;
  text2: string;
  text3: string;
  slug: string;
}

export interface Sku {
  skuId: number;
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

export interface ProductCategoryTexts {
  language: string;
  name: string;
  description1: string;
  description2: string;
  slug: string;
}

export interface ProductCategory {
  categoryId: number;
  parentCategoryId: number;
  hidden: boolean;
  active: boolean;
  order: number;
  texts: ProductCategoryTexts[];
}

export interface ProductImage {
  filename: string;
  order: number;
  tags: string[];
}

export interface ProductCampaign {
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
  texts: ProductParameterTexts[];
}

export interface RelatedProducts {
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

export interface Translated<T> {
  [lang: string]: T;
}

export interface CurrencyConverted<T> {
  [currency: string]: T;
}

export interface EntityBase {
  id: string;
  type: string;
}

export interface Product extends EntityBase {
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
  brandId: number;
  supplierId: number;
  freightClassId: number;
  intrastatCode: string;
  countryOfOrigin: string;
  externalProductId: string;
  mainCategoryId: number;
  texts?: Translated<ProductTexts>;
  skus?: Sku[];
  sortOrder?: number;
  prices?: CurrencyConverted<ProductPrices>;
  categories?: ProductCategory[];
  channels?: number[];
  images?: ProductImage[];
  languages?: string[];
  campaigns?: ProductCampaign[];
  parameters?: ProductParameter[];
  relatedProducts?: RelatedProducts[];
  variantValues?: VariantValues;
}

export interface BrandTexts {
  name: string;
  info1: string;
  info2: string;
  slug: string;
}

export interface Brand extends EntityBase {
  brandId: number;
  active: boolean;
  name: string;
  texts: Translated<BrandTexts>;
}

export interface CategoryTexts {
  description1: string;
  description2: string;
  slug: string;
}

export interface Category extends EntityBase {
  categoryId: number;
  name: string;
  parentCategoryId: number;
  hidden: boolean;
  active: boolean;
  order: number;
  texts: Translated<CategoryTexts>;
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

export interface PriceList {
  priceListId: number;
  channel: number;
  identifier: string;
  name: string;
  dateCreated: string;
  active: boolean;
  products?: PriceListProduct[];
}
