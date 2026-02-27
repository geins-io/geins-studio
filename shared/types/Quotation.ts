import type {
  CreateEntity,
  UpdateEntity,
  ResponseEntity,
  ApiOptions,
  Price,
  BatchQueryFiltered,
  SelectorCondition,
  BatchQueryResult,
  EntitySnapshot,
} from './index';

// =============================================================================
// Enums & Primitive Types
// =============================================================================

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
 * Communication message type
 */
export type QuotationMessageType =
  | 'quotationNote'
  | 'internal'
  | 'toCustomer'
  | 'fromCustomer';

// =============================================================================
// Response Sub-Types (returned by the API)
// =============================================================================

/**
 * Company (wholesale account) snapshot
 */
export interface QuotationCompany extends EntitySnapshot {
  name: string;
  vatNumber: string;
}

/**
 * Owner (sales rep) snapshot
 */
export interface QuotationOwner extends EntitySnapshot {
  firstName: string;
  lastName: string;
  phone: string;
}

/**
 * Customer (buyer) snapshot
 */
export interface QuotationCustomer extends EntitySnapshot {
  firstName: string;
  lastName: string;
  phone: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
}

/**
 * Address snapshot — matches the backend quotationAddress schema.
 * Fields align with the company Address type (addressLine1, firstName, etc.).
 */
export interface QuotationAddress extends EntitySnapshot {
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

/**
 * Valid payment method (response)
 */
export interface QuotationValidPaymentMethod {
  paymentId: number;
  name: string;
}

/**
 * Valid shipping method (response)
 */
export interface QuotationValidShippingMethod {
  shippingId: number;
  name: string;
  shippingFee: number;
}

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
  vat: number;
  grandTotalExVat: number;
  grandTotalIncVat: number;
}

// =============================================================================
// Preview Types
// =============================================================================

/**
 * Discount configuration for a quotation (used in create, update, and preview requests).
 */
export interface QuotationDiscountRequest {
  type: 'fixedAmount' | 'percent';
  value: number;
}

/**
 * Request body for the preview endpoint — calculates totals without persisting.
 */
export interface QuotationPreviewRequest {
  companyId?: string | null;
  buyerId?: string | null;
  suggestedShippingFee?: number | null;
  discount?: QuotationDiscountRequest | null;
  items?: QuotationItemCreate[] | null;
}

/**
 * Totals returned by the preview endpoint.
 * Uses suggestedShippingFee (not shipping) and omits margin.
 */
export interface QuotationPreviewTotal {
  subtotal: number;
  discount: number;
  suggestedShippingFee: number;
  grandTotalExVat: number;
  vat: number;
  grandTotalIncVat: number;
}

/**
 * Response from the preview endpoint.
 * Items are enriched with calculated ordPrice, listPrice, and unitPrice.
 */
export interface QuotationPreviewResponse {
  items?: QuotationItem[];
  total: QuotationPreviewTotal;
}

// =============================================================================
// Status Transition Request
// =============================================================================

/**
 * Request body for quotation status transitions (send, accept, reject, etc.)
 */
export interface StatusTransitionRequest {
  authorId: string;
  authorName: string;
  message?: {
    type: QuotationMessageType;
    message: string;
  };
}

// =============================================================================
// Request Sub-Types (sent to the API)
// =============================================================================

/**
 * Valid payment method request
 */
export interface QuotationValidPaymentMethodRequest {
  paymentId: string;
}

/**
 * Valid shipping method request
 */
export interface QuotationValidShippingMethodRequest {
  shippingId: string;
  shippingFee?: number;
}

// =============================================================================
// Quotation Base / Create / Update / Response
// =============================================================================

/**
 * Base Quotation type — shared properties between create, update, and response.
 */
export interface QuotationBase {
  name: string;
  channelId: string;
  marketId: string;
  validFrom?: string;
  validTo?: string;
  createdAt?: string;
  modifiedAt?: string;
  suggestedShippingFee?: number;
}

/**
 * Create request type matching the POST /quotation API schema.
 */
export interface QuotationCreate extends CreateEntity<QuotationBase> {
  companyId?: string;
  ownerId?: string;
  customerId?: string;
  terms?: string;
  billingAddressId?: string;
  shippingAddressId?: string;
  validPaymentMethods?: QuotationValidPaymentMethodRequest[];
  validShippingMethods?: QuotationValidShippingMethodRequest[];
  items?: QuotationItemCreate[];
  discount?: QuotationDiscountRequest | null;
}

/**
 * Update type for existing quotations
 */
export interface QuotationUpdate extends UpdateEntity<QuotationBase> {
  ownerId?: string;
  customerId?: string;
  billingAddressId?: string;
  shippingAddressId?: string;
  terms?: string;
  validPaymentMethods?: QuotationValidPaymentMethodRequest[];
  validShippingMethods?: QuotationValidShippingMethodRequest[];
  items?: QuotationItemCreate[];
  discount?: QuotationDiscountRequest | null;
}

/**
 * Response type from API
 */
export interface Quotation extends ResponseEntity<QuotationBase> {
  quotationNumber: string;
  currency: string;
  status: QuotationStatus;
  billingAddress: QuotationAddress;
  shippingAddress: QuotationAddress;
  total: QuotationTotal;
  orderId?: string;
  company?: QuotationCompany;
  owner?: QuotationOwner;
  customer?: QuotationCustomer;
  validPaymentMethods?: QuotationValidPaymentMethod[];
  validShippingMethods?: QuotationValidShippingMethod[];
  terms?: string;
  communication?: QuotationMessage[];
  changelog?: QuotationChangelog[];
  items?: QuotationItem[];
  discount?: QuotationDiscountRequest;
}

/**
 * List view type with computed display fields
 */
export interface QuotationList extends Omit<
  Quotation,
  'items' | 'communication' | 'changelog' | 'company' | 'owner'
> {
  company: string;
  products: string;
  sum: Price;
  expirationDate: string;
  dateCreated: string;
  market: string;
  channel: string;
  owner: string;
  buyer: string;
}

// =============================================================================
// Quotation Product Row (table display type)
// =============================================================================

/**
 * Row type for the quotation products table.
 * Maps quotation items + product data into a flat row for display.
 */
export interface QuotationProductRow {
  product: string;
  skuId: string;
  quantity: number;
  price: Price;
  priceListPrice: Price;
  quotationPrice: Price;
  // Internal fields for rendering (not displayed as columns):
  image: string;
  articleNumber: string;
  _id: string;
}

// =============================================================================
// Quotation Item Base / Create / Update / Response
// =============================================================================

/**
 * Base type for quotation items (response shape)
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

/**
 * Item create request — different shape from response, matches POST API schema
 */
export interface QuotationItemCreate {
  skuId: string;
  quantity: number;
  unitPrice?: number;
}

export type QuotationItemUpdate = UpdateEntity<QuotationItemBase>;
export type QuotationItem = ResponseEntity<QuotationItemBase>;

// =============================================================================
// Field Filtering & API Options
// =============================================================================

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

// =============================================================================
// Batch Query Types
// =============================================================================

/**
 * Quotation selection query for batch operations
 */
export interface QuotationSelectionQuery {
  condition?: SelectorCondition;
  quotationIds?: string[];
  quotationNumbers?: string[];
  names?: string[];
  currencies?: string[];
  marketIds?: string[];
  channelIds?: string[];
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
