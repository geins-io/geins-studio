export interface Localizations {
  name?: string;
  text1?: string;
  text2?: string;
  text3?: string;
  slug?: string;
}

export interface Sku extends EntityBase {
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

export interface ProductPrice {
  sellingPriceIncVat: number;
  sellingPriceExVat: number;
  regularPriceIncVat: number;
  regularPriceExVat: number;
  vatRate: number;
  salePrice?: SalePrice;
  campaignPrice?: CampaignPrice;
}

export interface ProductPricesGrouped {
  [channel: string]: {
    [currency: string]: {
      [country: string]: ProductPrice;
    };
  };
}

export interface ProductQueryParams {
  fields?: string;
  defaultChannel?: string;
  defaultCurrency?: string;
  defaultCountry?: string;
}

export interface Media extends EntityBase {
  filename: string;
  order: number;
  tags: string[];
}

export interface ProductCampaign extends EntityBase {
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

export interface RelatedProducts extends EntityBase {
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
  [channel: string]: {
    [currency: string]: {
      [country: string]: T;
    };
  };
}

export interface ProductBase {
  productId: number;
  name: string;
  thumbnail?: string;
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
  media?: Media[];
  localizations?: Localized<Localizations>;
  skus?: Sku[];
  sortOrder?: number;
  defaultPrice: ProductPrice;
  prices?: CurrencyConverted<ProductPrice>;
  categories?: Category[];
  channels?: string[];
  campaigns?: ProductCampaign[];
  parameters?: ProductParameter[];
  relatedProducts?: RelatedProducts[];
  variantValues?: VariantValues;
}

export type ProductCreate = CreateEntity<ProductBase>;
export type ProductUpdate = UpdateEntity<ProductBase>;
export type Product = ResponseEntity<ProductBase>;

export interface Brand extends EntityBase {
  active: boolean;
  name: string;
  localizations: Localized<Localizations>;
}

export interface Category extends EntityBase {
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

export interface ProductPricelistBase {
  channel: string;
  currency: string;
  identifier?: string;
  name: string;
  dateCreated: string;
  active: boolean;
  exVat: boolean;
  autoAddProducts: boolean;
  forced: boolean;
  products: PricelistProduct[];
  rules: PricelistRule[];
  productSelectionQuery: SelectorSelectionQueryBase;
}

export type ProductPricelistCreate = CreateEntity<ProductPricelistBase>;
export type ProductPricelistUpdate = UpdateEntity<ProductPricelistBase>;
export type ProductPricelist = ResponseEntity<ProductPricelistBase>;

export interface PricelistProduct {
  _id?: string;
  productId: string;
  price: number;
  staggeredCount: number;
}

export interface PricelistProductList extends EntityBaseWithName {
  thumbnail: string;
  purchasePrice: Price;
  regularPrice: Price;
  listPrice?: Price;
  discount: number;
  margin: number;
  quantityLevels: PricelistRule[];
  manual: boolean;
}

export interface PricelistProductReference {
  productId: string;
  staggeredCount: number;
}

export interface PricelistProductPatch {
  create: PricelistProduct[];
  delete: PricelistProductReference[];
}

export interface PricelistRule {
  quantity: number;
  margin?: number;
  discountPercent?: number;
  price?: number;
  applied?: boolean;
  global?: boolean;
}

export type PricelistRuleMode = 'margin' | 'discount';
