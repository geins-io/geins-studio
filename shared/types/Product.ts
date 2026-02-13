import type { ApiOptions, BatchQueryResult } from './Api';
import type {
  EntityBase,
  EntityBaseWithName,
  CreateEntity,
  UpdateEntity,
  ResponseEntity,
  Price,
} from './Global';
import type { SelectorSelectionQueryBase } from './Selector';

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

export type ProductFieldsFilter =
  | 'all'
  | 'localizations'
  | 'default'
  | 'skus'
  | 'sort'
  | 'prices'
  | 'defaultprice'
  | 'categories'
  | 'channels'
  | 'media'
  | 'campaigns'
  | 'attributes'
  | 'relatedproducts'
  | 'variant'
  | 'brand'
  | 'supplier'
  | 'stock';

export interface ProductApiOptions extends ApiOptions<ProductFieldsFilter> {
  currencies?: string[];
  localizations?: string[];
  defaultChannel?: string;
  defaultCurrency?: string;
  defaultCountry?: string;
  defaultLocale?: string;
}

export interface Brand extends EntityBase {
  active: boolean;
  name: string;
  localizations: Localized<Localizations>;
}

export interface BrandApiOptions {
  defaultLocale?: string;
}

export interface Category extends EntityBase {
  name: string;
  parentCategoryId: number;
  hidden: boolean;
  active: boolean;
  order: number;
  localizations: Localized<Localizations>;
}

export interface CategoryApiOptions {
  defaultLocale?: string;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

export interface ProductPriceListBase {
  channel: string;
  currency: string;
  identifier?: string;
  name: string;
  dateCreated: string;
  active: boolean;
  exVat: boolean;
  autoAddProducts: boolean;
  forced: boolean;
  rules?: PriceListRule[];
  productSelectionQuery?: SelectorSelectionQueryBase;
}

export interface ProductPriceListCreate extends CreateEntity<ProductPriceListBase> {
  products?: PriceListProduct[];
}
export interface ProductPriceListUpdate extends UpdateEntity<ProductPriceListBase> {
  products?: PriceListProduct[];
}
export interface ProductPriceList extends ResponseEntity<ProductPriceListBase> {
  products?: BatchQueryResult<PriceListProduct>;
}

export type ProductPriceListFieldsFilter =
  | 'all'
  | 'default'
  | 'products'
  | 'rules'
  | 'selectionquery'
  | 'productinfo';

export interface ProductPriceListApiOptions extends ApiOptions<ProductPriceListFieldsFilter> {
  pageSize?: string;
  defaultLocale?: string;
}

export interface PriceListProduct {
  _id?: string;
  productId: string;
  name?: string;
  thumbnail?: string;
  price?: number;
  regularPrice?: number;
  margin?: number;
  discountPercent?: number;
  ruleId?: string;
  staggeredCount: number;
  priceMode?: PriceListPriceMode;
  purchasePrice?: number;
  purchasePriceCurrency?: string;
  delete?: boolean;
}

export interface ProductPriceListProductApiOptions extends ApiOptions<ProductPriceListFieldsFilter> {
  defaultLocale?: string;
}

export interface PriceListProductPreview {
  productId: string;
  price?: number;
  margin?: number;
  discountPercent?: number;
}

export interface PriceListProductPreviewResponse {
  productId: string;
  price: number;
  margin: number;
  discountPercent: number;
}

export interface PriceListProductList extends EntityBaseWithName {
  thumbnail: string;
  purchasePrice: Price;
  regularPrice: Price;
  listPrice?: Price;
  discount: number;
  margin: number;
  volumePricing: PriceListRule[];
  priceMode: PriceListPriceMode;
}

export interface PriceListRule {
  _id?: string;
  internalId?: string; // Internal ID for tracking rules in UI
  quantity?: number;
  margin?: number;
  discountPercent?: number;
  price?: number;
  applied?: boolean;
  global?: boolean;
  lastFieldChanged?: PriceListRuleField;
}

export type PriceListRuleField = 'margin' | 'discountPercent' | 'price';

export type PriceListRuleMode = 'margin' | 'discount';

export type PriceListPriceMode =
  | 'fixed'
  | 'margin'
  | 'discount'
  | 'rule'
  | 'auto'
  | 'autoRule'
  | 'autoFixed';
