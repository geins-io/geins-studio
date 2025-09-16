import { SelectorCondition, type BatchQueryFiltered } from '#shared/types';

// Base Order types
export interface OrderBase {
  dateCreated: string;
  customerId: string;
  email: string;
  sumExVat: number;
  sumIncVat: number;
  wholesaleAccountId: string;
  channel: string;
  currency: string;
}

export interface OrderCreate extends CreateEntity<OrderBase> {
  items: OrderItemCreate[];
}

export interface OrderUpdate extends UpdateEntity<OrderBase> {
  items?: OrderItemUpdate[];
}

export interface Order extends ResponseEntity<OrderBase> {
  items?: OrderItem[];
}

// Order Item types
export interface OrderItemBase {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPriceExVat: number;
  unitPriceIncVat: number;
}

export type OrderItemCreate = CreateEntity<OrderItemBase>;
export type OrderItemUpdate = UpdateEntity<OrderItemBase>;
export type OrderItem = ResponseEntity<OrderItemBase>;

export type OrderFieldsFilter = 'all' | 'default' | 'items';
export type OrderApiOptions = ApiOptions<OrderFieldsFilter>;

// Order-specific selection query (follows the pattern from Selector.ts)
export interface OrderSelectionQuery {
  condition?: SelectorCondition;
  orderIds?: string[];
  wholesaleAccountIds?: string[];
  customerIds?: string[];
  channels?: string[];
}

// Follow the SelectorSelectionQueryBase pattern
export type OrderBatchQuery = BatchQueryFiltered<OrderSelectionQuery>;
