import type {
  CreateEntity,
  UpdateEntity,
  ResponseEntity,
  ApiOptions,
  Tooltip,
  Price,
  BatchQueryFiltered,
  SelectorCondition,
  BatchQueryResult,
} from './index';

/**
 * Status values for quotations
 */
export type QuotationStatus =
  | 'draft'
  | 'pending'
  | 'expired'
  | 'rejected'
  | 'accepted'
  | 'confirmed'
  | 'finalized'
  | 'canceled';

/**
 * Company (wholesale account) information
 */
export interface QuotationCompany {
  companyId: number;
  name: string;
  orgNr: string;
}

/**
 * Owner (sales rep) information
 */
export interface QuotationOwner {
  name: string;
  email: string;
  phone: string;
}

/**
 * Customer (buyer) information
 */
export interface QuotationCustomer {
  name: string;
  email: string;
  phone: string;
  approvedAt?: string;
  rejectedAt?: string;
}

/**
 * Address information
 */
export interface QuotationAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
  country: string;
}

/**
 * Valid payment method
 */
export interface QuotationValidPaymentMethod {
  paymentId: number;
  name: string;
  specialTerms?: string;
}

/**
 * Valid shipping method
 */
export interface QuotationValidShippingMethod {
  shippingId: number;
  name: string;
  specialTerms?: string;
}

/**
 * Quotation terms
 */
export interface QuotationTerms {
  text: string;
}

/**
 * Communication message type
 */
export type QuotationMessageType =
  | 'quotationNote'
  | 'internal'
  | 'toCustomer'
  | 'fromCustomer';

/**
 * Communication message
 */
export interface QuotationMessage {
  type: QuotationMessageType;
  author: string;
  message: string;
  timestamp: string;
}

/**
 * Quotation changelog entry
 */
export interface QuotationChangelog {
  change: string;
  author: string;
  timestamp: string;
}

/**
 * Quotation totals and summary
 */
export interface QuotationTotal {
  subtotal: number;
  discount: number;
  shipping: number;
  margin: number;
  tax: number;
}

/**
 * Base Quotation type with core properties
 */
export interface QuotationBase {
  quotationId: string;
  quotationNumber: string;
  name: string;
  currency: string;
  status: QuotationStatus;
  validFrom: string;
  validTo?: string;
  billingAddress: QuotationAddress;
  shippingAddress: QuotationAddress;
  total: QuotationTotal;
  orderId?: string;
  company?: QuotationCompany;
  owner?: QuotationOwner;
  customer?: QuotationCustomer;
  validPaymentMethods?: QuotationValidPaymentMethod[];
  validShippingMethods?: QuotationValidShippingMethod[];
  terms?: QuotationTerms;
  communication?: QuotationMessage[];
  changelog?: QuotationChangelog[];
}

/**
 * Create type for new quotations
 */
export interface QuotationCreate extends CreateEntity<QuotationBase> {
  items?: QuotationItemCreate[];
}

/**
 * Update type for existing quotations
 */
export interface QuotationUpdate extends UpdateEntity<QuotationBase> {
  items?: QuotationItemUpdate[];
}

/**
 * Response type from API
 */
export interface Quotation extends ResponseEntity<QuotationBase> {
  items?: QuotationItem[];
}

/**
 * List view type with computed tooltip fields for display
 */
export interface QuotationList extends ResponseEntity<QuotationBase> {
  // Computed display fields
  accountName: string;
  itemCount: number;
  sum: Price;
  expirationDate: string;
  createdBy: string;
  dateCreated: string;
  dateModified: string;
}

/**
 * Base type for quotation items
 */
export interface QuotationItemBase {
  name: string;
  articleNumber: string;
  sku: string;
  skuName: string;
  primaryImage: string;
  quantity: number;
  ordPrice: number;
  listPrice: number;
  unitPrice: number;
}

export type QuotationItemCreate = CreateEntity<QuotationItemBase>;
export type QuotationItemUpdate = UpdateEntity<QuotationItemBase>;
export type QuotationItem = ResponseEntity<QuotationItemBase>;

/**
 * Field filter options for API queries
 */
export type QuotationFieldsFilter =
  | 'default'
  | 'all'
  | 'company'
  | 'owner'
  | 'customer'
  | 'items'
  | 'changelog'
  | 'communication'
  | 'terms'
  | 'validShipping'
  | 'validPayment';

/**
 * API options type with field filtering
 */
export type QuotationApiOptions = ApiOptions<QuotationFieldsFilter>;

/**
 * Quotation selection query for batch operations
 */
export interface QuotationSelectionQuery {
  condition?: SelectorCondition;
  quotationIds?: string[];
  quotationNumbers?: string[];
  names?: string[];
  currencies?: string[];
  companyIds?: number[];
  companyNames?: string[];
  ownerIds?: number[];
  ownerNames?: string[];
  customerNames?: string[];
  customerEmails?: string[];
  statuses?: QuotationStatus[];
  validFrom?: string;
  validTo?: string;
}

/**
 * Batch query type for quotations
 */
export type QuotationBatchQuery = BatchQueryFiltered<QuotationSelectionQuery>;

/**
 * Batch query result type for quotations
 */
export type QuotationBatchQueryResult = BatchQueryResult<Quotation>;
