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
  buyers: CustomerBuyerCreate[];
  addresses: AddressCreate[];
  salesReps: string[];
  priceLists: string[];
}

export interface CustomerCompanyUpdate
  extends UpdateEntity<CustomerCompanyBase> {
  buyers?: CustomerBuyerUpdate[];
  addresses?: AddressUpdate[];
  salesReps?: string[];
  priceLists: string[];
}

export interface CustomerCompany extends ResponseEntity<CustomerCompanyBase> {
  buyers: CustomerBuyer[];
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

export interface CustomerBuyerBase {
  active?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  accountId?: string;
  priceLists?: ProductPriceList[];
  restrictToDedicatedPriceLists?: boolean;
}

export interface CustomerBuyerCreate
  extends Omit<CreateEntity<CustomerBuyerBase>, 'priceLists'> {
  _id: string; // TODO: Remove when fixed
  priceLists?: string[];
}

export interface CustomerBuyerUpdate
  extends Omit<UpdateEntity<CustomerBuyerBase>, 'priceLists'> {
  _id?: string; // TODO: Remove when fixed
  priceLists?: string[];
}

export type CustomerBuyer = ResponseEntity<CustomerBuyerBase>;

export interface CustomerBuyerList
  extends Omit<CustomerBuyer, 'priceLists'>,
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
