import type {
  CreateEntity,
  UpdateEntity,
  ResponseEntity,
  EntityBase,
  ApiOptions,
  Tooltip,
  Address,
  AddressCreate,
  AddressUpdate,
  ProductPriceList,
  Price,
} from './index';

// Customer Company types
export interface CustomerCompanyBase {
  name: string;
  active: boolean;
  vatNumber: string;
  externalId: string;
  channels: string[];
  tags: string[];
  exVat: boolean;
  limitedProductAccess: boolean;
  meta?: Record<string, unknown>;
}

export interface CustomerCompanyCreate
  extends CreateEntity<CustomerCompanyBase> {
  buyers: CompanyBuyerCreate[];
  addresses: AddressCreate[];
  salesReps: string[];
  priceLists: string[];
}

export interface CustomerCompanyUpdate
  extends UpdateEntity<CustomerCompanyBase> {
  buyers?: CompanyBuyerUpdate[];
  addresses?: AddressUpdate[];
  salesReps?: string[];
  priceLists: string[];
}

export interface CustomerCompany extends ResponseEntity<CustomerCompanyBase> {
  buyers: CompanyBuyer[];
  salesReps: CustomerSalesRep[];
  addresses: Address[];
  priceLists: CustomerPriceList[];
}

export type CustomerCompanyFieldsFilter =
  | 'all'
  | 'default'
  | 'addresses'
  | 'salesreps'
  | 'buyers'
  | 'pricelists';

export type CustomerCompanyApiOptions = ApiOptions<CustomerCompanyFieldsFilter>;

export interface CustomerCompanyList
  extends Omit<CustomerCompany, 'salesReps' | 'buyers' | 'priceLists'>,
    EntityBase {
  companyGroups: Tooltip;
  salesReps: Tooltip;
  buyers: Tooltip;
  priceLists: Tooltip;
}

export interface CustomerSalesRepBase {
  firstName: string;
  lastName: string;
  phone: string;
  accountIds: string[];
}

export type CustomerSalesRepCreate = CreateEntity<CustomerSalesRepBase>;
export type CustomerSalesRepUpdate = UpdateEntity<CustomerSalesRepBase>;
export type CustomerSalesRep = ResponseEntity<CustomerSalesRepBase>;

export interface CompanyBuyerBase {
  active?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  accountId?: string;
  priceLists?: ProductPriceList[];
  restrictToDedicatedPriceLists?: boolean;
}

export interface CompanyBuyerCreate
  extends Omit<CreateEntity<CompanyBuyerBase>, 'priceLists'> {
  _id: string; // TODO: Remove when fixed
  priceLists?: string[];
}

export interface CompanyBuyerUpdate
  extends Omit<UpdateEntity<CompanyBuyerBase>, 'priceLists'> {
  _id?: string; // TODO: Remove when fixed
  priceLists?: string[];
}

export type CompanyBuyer = ResponseEntity<CompanyBuyerBase>;

export interface CompanyBuyerList
  extends Omit<CompanyBuyer, 'priceLists'>,
    EntityBase {
  priceLists: Tooltip;
}

export interface CustomerVatValidation {
  vatNumber: string;
  countryCode: string;
  valid: boolean;
  name: string;
  address: string;
}

export interface CustomerOrder {
  _id: string;
  created: string;
  channel: string;
  buyer?: Tooltip;
  sumIncVat: Price;
  sumExVat: Price;
  customerCompany?: string;
  priceLists?: Tooltip;
  items?: number;
  status: string;
}

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
