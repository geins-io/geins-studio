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
  extends Omit<WholesaleAccount, '_id' | 'salesReps'> {
  salesReps: string[];
}

export interface WholesaleAccountList
  extends Omit<WholesaleAccount, 'salesReps'> {
  accountGroups: string[];
  salesReps: string[];
}

export interface WholesaleSalesRep extends GeinsEntity {
  firstName: string;
  lastName: string;
  phone: string;
  accountIds: string[];
}

export interface WholesaleBuyer extends GeinsEntity {
  active?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  accountId?: string;
}
