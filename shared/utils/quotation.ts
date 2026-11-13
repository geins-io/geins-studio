import type {
  Quotation,
  QuotationBuyerDecision,
  QuotationCustomer,
  QuotationOrderDetails,
  QuotationOrderDetailsForm,
  QuotationOrderDetailsRequest,
  QuotationStatus,
} from '#shared/types';
import { calendarDayToLocalIso, toCalendarDayIso } from './calendar-day';

/**
 * Statuses the seller edits like a draft: their own draft, or a request the
 * buyer has sent. Every other status renders the read-only (sent) layout.
 */
export const EDITABLE_QUOTATION_STATUSES: readonly QuotationStatus[] = [
  'draft',
  'requested',
];

/**
 * Statuses the API lets the seller delete in.
 */
export const DELETABLE_QUOTATION_STATUSES: readonly QuotationStatus[] = [
  'draft',
  'requested',
  'rejected',
  'expired',
  'canceled',
];

/**
 * Whether an external system (e.g. Monitor) owns the quotation. The API then
 * refuses every update, delete, extend and status change, so Studio shows it
 * read-only. A Studio quotation gains the reference once it's exported, so
 * check it on every load.
 */
export function isQuotationExternal(
  quotation: Pick<Quotation, 'externalReference'>,
): boolean {
  return !!quotation.externalReference;
}

/**
 * Whether the seller fills in the order details: only on their own draft. A
 * buyer's request brings its own (shown in Request details), and once the
 * quotation is sent they're locked.
 */
export function canEditOrderDetails(
  quotation: Pick<Quotation, 'status' | 'externalReference' | 'request'>,
): boolean {
  return (
    quotation.status === 'draft' &&
    !quotation.request &&
    !isQuotationExternal(quotation)
  );
}

/**
 * Whether the quotation opens in the editable layout (General + Products).
 */
export function isQuotationEditable(
  quotation: Pick<Quotation, 'status' | 'externalReference'>,
): boolean {
  return (
    EDITABLE_QUOTATION_STATUSES.includes(quotation.status) &&
    !isQuotationExternal(quotation)
  );
}

/**
 * Whether the seller can delete the quotation.
 */
export function isQuotationDeletable(
  quotation: Pick<Quotation, 'status' | 'externalReference'>,
): boolean {
  return (
    DELETABLE_QUOTATION_STATUSES.includes(quotation.status) &&
    !isQuotationExternal(quotation)
  );
}

/**
 * The order-detail text fields, with the most characters the API accepts
 */
export const ORDER_DETAILS_MAX_LENGTH = {
  goodsLabel: 500,
  customerOrderNumber: 30,
} as const;

export const ORDER_DETAILS_TEXT_FIELDS = Object.keys(
  ORDER_DETAILS_MAX_LENGTH,
) as (keyof typeof ORDER_DETAILS_MAX_LENGTH)[];

export const ORDER_DETAILS_FIELDS: readonly (keyof QuotationOrderDetailsForm)[] =
  [...ORDER_DETAILS_TEXT_FIELDS, 'desiredDeliveryDate'];

/**
 * Form values for the order details, seeded from what's stored. The delivery
 * date becomes its day's local midnight, so the date picker shows that day.
 */
export function orderDetailsFormValues(
  stored?: QuotationOrderDetails | null,
): QuotationOrderDetailsForm {
  return {
    goodsLabel: stored?.goodsLabel ?? '',
    customerOrderNumber: stored?.customerOrderNumber ?? '',
    desiredDeliveryDate: stored?.desiredDeliveryDate
      ? (calendarDayToLocalIso(stored.desiredDeliveryDate) ?? '')
      : '',
  };
}

/**
 * The `orderDetails` to send: only the fields that are set and differ from
 * what's stored, since the API keeps a field left out. The delivery date goes
 * as a calendar day. `undefined` when nothing changed — the API refuses an
 * empty object.
 */
export function orderDetailsRequest(
  values: Partial<QuotationOrderDetailsForm> | undefined,
  stored?: QuotationOrderDetails | null,
): QuotationOrderDetailsRequest | undefined {
  const request: QuotationOrderDetailsRequest = {};

  for (const field of ORDER_DETAILS_TEXT_FIELDS) {
    const value = values?.[field]?.trim();
    if (value && value !== stored?.[field]?.trim()) request[field] = value;
  }

  const day = values?.desiredDeliveryDate
    ? toCalendarDayIso(values.desiredDeliveryDate)
    : undefined;
  const storedDay = stored?.desiredDeliveryDate
    ? toCalendarDayIso(stored.desiredDeliveryDate)
    : undefined;
  if (day && day !== storedDay) request.desiredDeliveryDate = day;

  return Object.keys(request).length ? request : undefined;
}

/**
 * Whether and when the buyer accepted or rejected the quotation, from the
 * customer snapshot. Both dates stay null until the buyer acts; should both
 * ever be set, the later one is the decision that stands.
 */
export function quotationBuyerDecision(
  customer?: Pick<QuotationCustomer, 'approvedAt' | 'rejectedAt'> | null,
): QuotationBuyerDecision | null {
  const approvedAt = customer?.approvedAt;
  const rejectedAt = customer?.rejectedAt;
  if (
    rejectedAt &&
    (!approvedAt || Date.parse(rejectedAt) > Date.parse(approvedAt))
  ) {
    return { decision: 'rejected', at: rejectedAt };
  }
  if (approvedAt) return { decision: 'accepted', at: approvedAt };
  return null;
}
