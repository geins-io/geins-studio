import type { AddressCreate } from './Global';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
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
  priceLists: WholesalePricelist[];
}

export interface WholesaleAccountList
  extends Omit<WholesaleAccount, 'salesReps' | 'buyers'>,
    EntityBase {
  accountGroups: Tooltip;
  salesReps: Tooltip;
  buyers: Tooltip;
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
}

export interface WholesaleBuyerCreate extends CreateEntity<WholesaleBuyerBase> {
  _id: string; // TODO: Remove when fixed
}

export interface WholesaleBuyerUpdate extends UpdateEntity<WholesaleBuyerBase> {
  _id?: string; // TODO: Remove when fixed
}

export type WholesaleBuyer = ResponseEntity<WholesaleBuyerBase> & {};

export interface WholesaleVatValidation {
  vatNumber: string;
  countryCode: string;
  valid: boolean;
  name: string;
  address: string;
}

export interface WholesalePricelist
  extends Omit<
    ProductPricelist,
    | 'products'
    | 'rules'
    | 'productSelectionQuery'
    | 'autoAddProducts'
    | 'forced'
    | 'dateCreated'
  > {
  productCount: number;
}
