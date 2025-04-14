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
  buyers: string[];
  salesRepsNames: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
}

export interface WholesaleAccountAddress {
  id: string;
  type: 'billing' | 'delivery';
  careOf?: string;
  address1: string;
  address2?: string;
  address3?: string;
  zipCode: string;
  city: string;
  country: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
}
export interface WholesaleSalesRep extends GeinsEntity {
  firstName: string;
  lastName: string;
  phone: string;
  accountIds: string[];
}
