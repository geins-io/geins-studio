// @vitest-environment node
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import type {
  QuotationExternalReference,
  QuotationOrderDetails,
  QuotationStatus,
} from '#shared/types';
import {
  canEditOrderDetails,
  isQuotationDeletable,
  isQuotationEditable,
  isQuotationExternal,
  orderDetailsFormValues,
  orderDetailsRequest,
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

describe('canEditOrderDetails', () => {
  it('edits order details on a draft', () => {
    expect(canEditOrderDetails({ status: 'draft' })).toBe(true);
  });

  it.each<QuotationStatus>([
    'requested',
    'requestDraft',
    'pending',
    'expired',
    'accepted',
    'confirmed',
    'finalized',
    'rejected',
    'canceled',
  ])('locks them on %s', (status) => {
    expect(canEditOrderDetails({ status })).toBe(false);
  });

  it('locks them on a draft that carries a request', () => {
    expect(
      canEditOrderDetails({ status: 'draft', request: { goodsLabel: 'A' } }),
    ).toBe(false);
  });

  it('locks them on an external draft', () => {
    expect(canEditOrderDetails({ status: 'draft', externalReference })).toBe(
      false,
    );
  });
});

describe('order details', () => {
  const stored: QuotationOrderDetails = {
    goodsLabel: 'Project Alpha',
    customerOrderNumber: 'PO-1',
    desiredDeliveryDate: '2026-11-20T00:00:00Z',
    customerReference: null,
  };
  let originalTz: string | undefined;

  beforeEach(() => {
    originalTz = process.env.TZ;
    process.env.TZ = 'Europe/Stockholm';
  });
  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  describe('orderDetailsFormValues', () => {
    it('seeds empty strings when nothing is stored', () => {
      expect(orderDetailsFormValues(undefined)).toEqual({
        goodsLabel: '',
        customerOrderNumber: '',
        desiredDeliveryDate: '',
      });
    });

    it('seeds the delivery date as its local midnight', () => {
      expect(orderDetailsFormValues(stored).desiredDeliveryDate).toBe(
        '2026-11-19T23:00:00.000Z',
      );
    });
  });

  describe('orderDetailsRequest', () => {
    it('is undefined when no field is set', () => {
      expect(orderDetailsRequest(orderDetailsFormValues())).toBeUndefined();
      expect(orderDetailsRequest(undefined)).toBeUndefined();
    });

    it('sends only the fields that are set', () => {
      expect(
        orderDetailsRequest({
          ...orderDetailsFormValues(),
          customerOrderNumber: ' PO-9 ',
          desiredDeliveryDate: new Date('2026-12-01').toISOString(),
        }),
      ).toEqual({
        customerOrderNumber: 'PO-9',
        desiredDeliveryDate: '2026-12-01T00:00:00Z',
      });
    });

    it('is undefined when the stored values come back unchanged', () => {
      expect(
        orderDetailsRequest(orderDetailsFormValues(stored), stored),
      ).toBeUndefined();
    });

    it('sends only what changed from the stored values', () => {
      expect(
        orderDetailsRequest(
          { ...orderDetailsFormValues(stored), goodsLabel: 'Project Beta' },
          stored,
        ),
      ).toEqual({ goodsLabel: 'Project Beta' });
    });

    it('leaves out an emptied stored value, which the API keeps', () => {
      expect(
        orderDetailsRequest(
          { ...orderDetailsFormValues(stored), customerOrderNumber: '' },
          stored,
        ),
      ).toBeUndefined();
    });
  });
});
