// Wholesale Account types
export interface WholesaleAccountBase {
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

export interface WholesaleAccountCreate
  extends CreateEntity<WholesaleAccountBase> {
  buyers: WholesaleBuyerCreate[];
  addresses: AddressCreate[];
  salesReps: string[];
  priceLists: string[];
}

export interface WholesaleAccountUpdate
  extends UpdateEntity<WholesaleAccountBase> {
  buyers?: WholesaleBuyerUpdate[];
  addresses?: AddressUpdate[];
  salesReps?: string[];
  priceLists: string[];
}

export interface WholesaleAccount extends ResponseEntity<WholesaleAccountBase> {
  buyers: WholesaleBuyer[];
  salesReps: WholesaleSalesRep[];
  addresses: Address[];
  priceLists: WholesalePriceList[];
}

export type WholesaleAccountFieldsFilter =
  | 'all'
  | 'default'
  | 'addresses'
  | 'salesreps'
  | 'buyers'
  | 'pricelists';

export type WholesaleAccountApiOptions =
  ApiOptions<WholesaleAccountFieldsFilter>;

export interface WholesaleAccountList
  extends Omit<WholesaleAccount, 'salesReps' | 'buyers' | 'priceLists'>,
    EntityBase {
  accountGroups: Tooltip;
  salesReps: Tooltip;
  buyers: Tooltip;
  priceLists: Tooltip;
}

export interface WholesaleSalesRepBase {
  firstName: string;
  lastName: string;
  phone: string;
  accountIds: string[];
}

export type WholesaleSalesRepCreate = CreateEntity<WholesaleSalesRepBase>;
export type WholesaleSalesRepUpdate = UpdateEntity<WholesaleSalesRepBase>;
export type WholesaleSalesRep = ResponseEntity<WholesaleSalesRepBase>;

export interface WholesaleBuyerBase {
  active?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  accountId?: string;
  priceLists?: ProductPriceList[];
  restrictToDedicatedPriceLists?: boolean;
}

export interface WholesaleBuyerCreate
  extends Omit<CreateEntity<WholesaleBuyerBase>, 'priceLists'> {
  _id: string; // TODO: Remove when fixed
  priceLists?: string[];
}

export interface WholesaleBuyerUpdate
  extends Omit<UpdateEntity<WholesaleBuyerBase>, 'priceLists'> {
  _id?: string; // TODO: Remove when fixed
  priceLists?: string[];
}

export type WholesaleBuyer = ResponseEntity<WholesaleBuyerBase> & {};

export interface WholesaleBuyerList
  extends Omit<WholesaleBuyer, 'priceLists'>,
    EntityBase {
  priceLists: Tooltip;
}

export interface WholesaleVatValidation {
  vatNumber: string;
  countryCode: string;
  valid: boolean;
  name: string;
  address: string;
}

export interface WholesalePriceList
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

export interface WholesaleOrder {
  _id: string;
  created: string;
  channel: string;
  buyer?: Tooltip;
  sumIncVat: Price;
  sumExVat: Price;
  wholesaleAccount?: string;
  priceLists?: Tooltip;
  items?: number;
  status: string;
}
