export type StringKeyOf<T> = Extract<keyof T, string>;

export interface GeinsEntity {
  _id?: string;
  _type?: string;
  name?: string;
}

export interface DataItem {
  label: string;
  value: string;
}

export type DataList = DataItem[];

export interface NavigationItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: unknown;
  children?: NavigationItem[];
}

export interface GeinsApiError {
  status: number;
  method: string;
  url: string;
  message: string;
  timestamp: string;
  type: GeinsErrorType;
  originalError: unknown;
}

export type GeinsErrorType =
  | 'AUTH_ERROR'
  | 'PERMISSION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'SERVER_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'API_ERROR'
  | 'TIMEOUT_ERROR'
  | 'CANCELLED_ERROR'
  | 'NETWORK_ERROR';

export type AddressType = 'billing' | 'shipping' | 'billingandshipping';

export interface Address extends GeinsEntity {
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
