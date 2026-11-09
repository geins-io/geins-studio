// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { QuotationStatus } from '#shared/types';
import { isQuotationEditable } from '../quotation';

describe('isQuotationEditable', () => {
  it.each<QuotationStatus>(['draft', 'requested'])('edits %s', (status) => {
    expect(isQuotationEditable({ status })).toBe(true);
  });

  it.each<QuotationStatus>([
    'requestDraft',
    'pending',
    'accepted',
    'confirmed',
    'finalized',
    'rejected',
    'expired',
    'canceled',
  ])('locks %s', (status) => {
    expect(isQuotationEditable({ status })).toBe(false);
  });
});
