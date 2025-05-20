import type { GeinsEntity } from './Global';

export interface WholesaleAccountInput {
  name?: string;
  active: boolean;
  orgNr: string;
  externalId: string;
  channels: string[];
  tags: string[];
  salesReps: string[];
  exVat: boolean;
  addresses: Address[];
  buyers: WholesaleBuyer[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
}
export interface WholesaleAccount
  extends GeinsEntity,
    Omit<WholesaleAccountInput, 'salesReps'> {
  salesReps: WholesaleSalesRep[];
}

export interface WholesaleAccountList
  extends GeinsEntity,
    WholesaleAccountInput {
  accountGroups: string[];
  salesReps: string[];
}

export interface WholesaleSalesRep extends GeinsEntity {
  firstName: string;
  lastName: string;
  phone: string;
  accountIds: string[];
}

export interface WholesaleBuyerInput {
  active?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  accountId?: string;
  // TODO: Remove when fixed
  _id: string;
}

export interface WholesaleBuyer extends WholesaleBuyerInput, GeinsEntity {}
