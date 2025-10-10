export type StringKeyOf<T> = Extract<keyof T, string>;

export const enum DataItemDisplayType {
  String = 'string',
  Array = 'array',
  Copy = 'copy',
}
export interface EntityBase {
  _id: string;
  _type: string;
}

export interface EntityBaseWithName extends Omit<EntityBase, '_type'> {
  name: string;
}

// Utility types for consistent CRUD operations
export type CreateEntity<T> = Omit<T, keyof EntityBase>;
export type UpdateEntity<T> = Partial<CreateEntity<T>> & Partial<EntityBase>;
export type ResponseEntity<T> = T & EntityBase;

export interface DataItem {
  label: string;
  value:
    | string
    | number
    | boolean
    | Array<string>
    | Array<number>
    | Array<Record<string, unknown>>
    | Record<string, unknown>;
  displayValue?: string;
  displayType?: DataItemDisplayType;
  entityName?: string;
}
export interface PlainDataItem {
  label: string;
  value: string;
}

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

export interface AddressBase {
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

export type AddressCreate = CreateEntity<AddressBase>;
export type AddressUpdate = UpdateEntity<AddressBase>;
export type Address = ResponseEntity<AddressBase>;

export interface CustomerBase {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export type CustomerCreate = CreateEntity<CustomerBase>;
export type CustomerUpdate = UpdateEntity<CustomerBase>;
export type Customer = ResponseEntity<CustomerBase>;

export interface Tooltip {
  displayValue: string;
  contentValue: string;
  disabled?: boolean;
}

export interface Price {
  price?: string;
  currency: string;
  placeholder?: string;
}
