import type { GeinsEntity } from './Global';

export interface WholesaleAccount extends GeinsEntity {
  name: string;
  active: boolean;
  orgNr: string;
  externalId: string;
  channels: string[];
  tags: string[];
  addresses: WholesaleAccountAddress[];
  salesReps: WholesaleSalesRep[];
  buyers: WholesaleBuyer[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
}
export interface WholesaleAccountInput
  extends Omit<WholesaleAccount, 'salesReps'> {
  salesReps: string[];
}

export interface WholesaleAccountList extends WholesaleAccountInput {
  groups: string[];
}

export type AddressType = 'billing' | 'shipping' | 'billingandshipping';

export interface WholesaleAccountAddress extends GeinsEntity {
  addressType?: AddressType;
  addressReferenceId?: string;
  email?: string;
  phone?: string;
  company?: string;
  firstName?: string;
  lastName?: string;
  careOf?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
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
