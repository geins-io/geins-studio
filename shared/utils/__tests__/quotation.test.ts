// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type {
  QuotationExternalReference,
  QuotationStatus,
} from '#shared/types';
import {
  isQuotationDeletable,
  isQuotationEditable,
  isQuotationExternal,
} from '../quotation';

const externalReference: QuotationExternalReference = {
  system: 'monitor-erp',
  id: 'Q-99001',
  number: '99001',
  version: 1,
};

describe('isQuotationExternal', () => {
  it('is external with an externalReference', () => {
    expect(isQuotationExternal({ externalReference })).toBe(true);
  });

  it('is not external without one', () => {
    expect(isQuotationExternal({})).toBe(false);
    expect(isQuotationExternal({ externalReference: undefined })).toBe(false);
  });
});

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

  it.each<QuotationStatus>(['draft', 'requested'])(
    'locks an external %s',
    (status) => {
      expect(isQuotationEditable({ status, externalReference })).toBe(false);
    },
  );
});

describe('isQuotationDeletable', () => {
  it.each<QuotationStatus>([
    'draft',
    'requested',
    'rejected',
    'expired',
    'canceled',
  ])('deletes %s', (status) => {
    expect(isQuotationDeletable({ status })).toBe(true);
  });

  it.each<QuotationStatus>([
    'requestDraft',
    'pending',
    'accepted',
    'confirmed',
    'finalized',
  ])('keeps %s', (status) => {
    expect(isQuotationDeletable({ status })).toBe(false);
  });

  it('keeps an external quotation in any deletable status', () => {
    expect(isQuotationDeletable({ status: 'draft', externalReference })).toBe(
      false,
    );
    expect(
      isQuotationDeletable({ status: 'canceled', externalReference }),
    ).toBe(false);
  });
});
