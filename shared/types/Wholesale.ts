export interface WholesaleAccount {
  id: string;
  name: string;
  organizationNumber: string;
  externalId: string;
  channels: string[];
  tags: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  addresses: WholesaleAccountAddress[];
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
