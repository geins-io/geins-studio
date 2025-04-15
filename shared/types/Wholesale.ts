import type { GeinsEntity } from './Global';

export interface WholesaleAccount extends GeinsEntity {
  name: string;
  active: boolean;
  organizationNumber: string;
  externalId: string;
  channels: string[];
  tags: string[];
  addresses: WholesaleAccountAddress[];
  salesReps: WholesaleSalesRep[];
  buyers: WholesaleBuyer[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
}
export interface WholesaleAccountCreate
  extends Omit<WholesaleAccount, 'salesReps'> {
  salesReps: string[];
}

export interface WholesaleAccountList extends WholesaleAccountCreate {
  groups: string[];
}

export type AddressType = 'billing' | 'delivery';

export interface WholesaleAccountAddress extends GeinsEntity {
  addressType?: AddressType;
  email?: string;
  phone?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  careOf?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  zip?: string;
  city?: string;
  region?: string;
  country?: string;
}

export interface WholesaleSalesRep extends GeinsEntity {
  firstName: string;
  lastName: string;
  phone: string;
  accountIds: string[];
}

export interface WholesaleBuyer extends GeinsEntity {
  firstName: string;
  lastName: string;
  phone: string;
  accountId: string;
}
