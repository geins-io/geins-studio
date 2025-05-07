import type { GeinsEntity } from './Global';

export interface WholesaleAccount extends GeinsEntity {
  name: string;
  active: boolean;
  orgNr: string;
  externalId: string;
  channels: string[];
  tags: string[];
  addresses: Address[];
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
  accountGroups: string[];
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
