import type { Quotation, QuotationStatus } from '#shared/types';

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
