import type {
  CreateEntity,
  UpdateEntity,
  ResponseEntity,
  ApiOptions,
  Tooltip,
  Price,
} from './index';

/**
 * Status values for quotations
 */
export type QuotationStatus =
  | 'draft'
  | 'pending'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired';

/**
 * Base Quotation type with core properties
 */
export interface QuotationBase {
  name: string;
  status: QuotationStatus;
  accountId: string;
  accountName?: string;
  dateCreated: string;
  dateModified: string;
  sum: Price;
  expirationDate: string;
  itemCount: number;
  createdBy: string;
  channel?: string;
  currency?: string;
  notes?: string;
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
 * List view type with tooltip information
 */
export interface QuotationList extends Omit<Quotation, 'items'> {
  items: Tooltip;
}

/**
 * Base type for quotation items
 */
export interface QuotationItemBase {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export type QuotationItemCreate = CreateEntity<QuotationItemBase>;
export type QuotationItemUpdate = UpdateEntity<QuotationItemBase>;
export type QuotationItem = ResponseEntity<QuotationItemBase>;

/**
 * Field filter options for API queries
 */
export type QuotationFieldsFilter = 'all' | 'default' | 'items';

/**
 * API options type with field filtering
 */
export type QuotationApiOptions = ApiOptions<QuotationFieldsFilter>;
