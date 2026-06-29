import type { EntityKey } from '../utils/entities';

export type StringKeyOf<T> = Extract<keyof T, string>;

/**
 * Known status values for StatusBadge with dedicated styling.
 * Any other string falls back to 'outline' variant with auto-capitalized text.
 */
export type StatusBadgeKnownStatus =
  | 'pending'
  | 'on-hold'
  | 'backorder'
  | 'partial'
  | 'sent'
  | 'cancelled'
  | 'rejected'
  | 'refunded'
  | 'inactive'
  | 'accepted'
  | 'completed'
  | 'confirmed'
  | 'finalized'
  | 'canceled'
  | 'draft'
  | 'expired'
  | 'healthy'
  | 'degraded'
  | 'unhealthy'
  | 'idle'
  | 'enabled';

/**
 * StatusBadge accepts booleans (active/inactive), known statuses with
 * dedicated styling, or any string (rendered with 'outline' variant).
 */
export type StatusBadgeStatus =
  | boolean
  | StatusBadgeKnownStatus
  | (string & {});

export const enum DataItemDisplayType {
  String = 'string',
  Array = 'array',
  Copy = 'copy',
  Link = 'link',
}
export interface EntityBase {
  _id: string;
  _type: string;
}

/**
 * Shared base for snapshot sub-objects stored with an entity.
 * Extends EntityBase with a timestamp for when the snapshot was captured.
 */
export interface EntitySnapshot extends EntityBase {
  _snapshotAt?: string | null;
}

export interface EntityBaseWithName extends Omit<EntityBase, '_type'> {
  name: string;
  displayName?: string;
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
  href?: string;
  target?: string;
}
export interface PlainDataItem {
  label: string;
  value: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: string;
  children?: NavigationItem[];
  hideFromMenu?: boolean;

  // Initial expand state for collapsible groups (items with children).
  // Defaults to `true` (expanded). Set `false` to start collapsed — the group
  // still auto-expands when the current route matches one of its children.
  defaultOpen?: boolean;

  // Role-based access control
  roles?: string[]; // e.g., ['admin', 'editor', 'viewer']
  permissions?: string[]; // e.g., ['customer.read', 'products.write']

  group?: string; // Group items together (e.g., 'workspace', 'settings')

  // Child page pattern - defines dynamic child routes
  // Example: '/customer/account/:id' matches /customer/account/123
  // Used for auto-clearing breadcrumb overrides on navigation
  childPattern?: string;
}

export interface GeinsApiError {
  status: number;
  method: string;
  url: string;
  message: string;
  timestamp: string;
  type: GeinsErrorType;
  originalError: unknown;
  // Network cause for connection-level failures (DNS/TLS/ECONNRESET/timeout).
  // Non-enumerable on the raw Error, so captured explicitly.
  cause?: { name?: string; code?: string; message?: string };
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

/**
 * Semantic action for the global API error toast. Maps to the
 * `error_{action}_entity` i18n key (e.g. 'creating' → `error_creating_entity`),
 * which is a full grammatically-correct sentence per locale — we cannot inject
 * a bare verb into one template because verb position/conjugation differ
 * between languages (en: "…while creating {entity}", sv: "…när {entity} skapades").
 */
export type GeinsErrorAction =
  | 'creating'
  | 'updating'
  | 'deleting'
  | 'sending'
  | 'copying'
  | 'adding';

/**
 * Optional per-request context attached to a $geinsApi mutation call. When
 * present, the global error toast renders the specific
 * `error_{action}_entity` message with `entity` as the i18n entity key
 * (e.g. 'price_list'); when absent it falls back to the generic message.
 * Rides through ofetch options into the interceptors.
 */
export interface GeinsErrorContext {
  action: GeinsErrorAction;
  /** Entity-name i18n key — a domain-entity key from `ENTITIES` (`#shared/utils/entities`), NOT a translated string. */
  entity: EntityKey;
}

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

export interface FlagText {
  code: string;
  label: string;
}
