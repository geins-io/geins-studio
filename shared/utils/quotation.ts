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
 * Whether the quotation opens in the editable layout (General + Products).
 */
export function isQuotationEditable(
  quotation: Pick<Quotation, 'status'>,
): boolean {
  return EDITABLE_QUOTATION_STATUSES.includes(quotation.status);
}
