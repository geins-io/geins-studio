// @vitest-environment node
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import type {
  QuotationExternalReference,
  QuotationOrderDetails,
  QuotationRevision,
  QuotationStatus,
} from '#shared/types';
import {
  canEditOrderDetails,
  isAnsweredRequest,
  isQuotationDeletable,
  isQuotationEditable,
  isQuotationExternal,
  isRevisionDraft,
  openRevisionDraft,
  withoutLinkedRevisionDrafts,
  orderDetailsFormValues,
  orderDetailsRequest,
  quotationBuyerDecision,
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
  it('edits a draft', () => {
    expect(isQuotationEditable({ status: 'draft' })).toBe(true);
  });

  it.each<QuotationStatus>([
    'requestDraft',
    'requested',
    'pending',
    'accepted',
    'confirmed',
    'finalized',
    'rejected',
    'expired',
    'canceled',
    'revised',
  ])('locks %s', (status) => {
    expect(isQuotationEditable({ status })).toBe(false);
  });

  it('locks an external draft', () => {
    expect(isQuotationEditable({ status: 'draft', externalReference })).toBe(
      false,
    );
  });
});

describe('isQuotationDeletable', () => {
  it.each<QuotationStatus>(['draft', 'rejected', 'expired', 'canceled'])(
    'deletes %s',
    (status) => {
      expect(isQuotationDeletable({ status })).toBe(true);
    },
  );

  it.each<QuotationStatus>([
    'requestDraft',
    'requested',
    'pending',
    'accepted',
    'confirmed',
    'finalized',
    'revised',
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

describe('isAnsweredRequest', () => {
  it('is an answered request when revised and never sent', () => {
    expect(isAnsweredRequest({ status: 'revised' })).toBe(true);
    expect(isAnsweredRequest({ status: 'revised', validFrom: '' })).toBe(true);
  });

  it('is a revised offer when it was sent', () => {
    expect(
      isAnsweredRequest({
        status: 'revised',
        validFrom: '2026-11-02T09:00:00Z',
      }),
    ).toBe(false);
  });

  it.each<QuotationStatus>(['requested', 'draft', 'pending', 'canceled'])(
    'is not one in %s',
    (status) => {
      expect(isAnsweredRequest({ status })).toBe(false);
    },
  );
});

describe('revision drafts', () => {
  const revisionOf = { quotationId: 'q-00', quotationNumber: '2611-3-0018-00' };

  it('is a revision draft with a revisionOf', () => {
    expect(isRevisionDraft({ status: 'draft', revisionOf })).toBe(true);
  });

  it('is not one without a revisionOf, or once sent', () => {
    expect(isRevisionDraft({ status: 'draft' })).toBe(false);
    expect(isRevisionDraft({ status: 'draft', revisionOf: null })).toBe(false);
    expect(isRevisionDraft({ status: 'pending', revisionOf })).toBe(false);
  });

  const version = (
    quotationId: string,
    revision: number,
    status: QuotationStatus,
  ): QuotationRevision => ({
    quotationId,
    quotationNumber: `2611-3-0018-0${revision}`,
    revision,
    status,
  });

  it("finds the chain's open draft", () => {
    const draft = version('q-02', 2, 'draft');
    expect(
      openRevisionDraft({
        _id: 'q-01',
        revisions: [
          draft,
          version('q-01', 1, 'pending'),
          version('q-00', 0, 'revised'),
        ],
      }),
    ).toBe(draft);
  });

  it('finds none when the chain has no draft, or the draft is the quotation', () => {
    expect(openRevisionDraft({ _id: 'q-01' })).toBeUndefined();
    expect(openRevisionDraft({ _id: 'q-01', revisions: null })).toBeUndefined();
    expect(
      openRevisionDraft({
        _id: 'q-01',
        revisions: [
          version('q-01', 1, 'pending'),
          version('q-00', 0, 'revised'),
        ],
      }),
    ).toBeUndefined();
    expect(
      openRevisionDraft({
        _id: 'q-01',
        revisions: [version('q-01', 1, 'draft'), version('q-00', 0, 'revised')],
      }),
    ).toBeUndefined();
  });
});

describe('withoutLinkedRevisionDrafts', () => {
  const ref = (quotationId: string) => ({
    quotationId,
    quotationNumber: `2611-3-0018-${quotationId}`,
  });
  const version = (
    quotationId: string,
    status: QuotationStatus,
  ): QuotationRevision => ({
    ...ref(quotationId),
    revision: Number(quotationId),
    status,
  });
  const chain = [
    version('02', 'draft'),
    version('01', 'pending'),
    version('00', 'revised'),
  ];
  const live = {
    _id: '01',
    status: 'pending' as const,
    revisionOf: ref('00'),
    revisions: chain,
  };
  const draft = {
    _id: '02',
    status: 'draft' as const,
    revisionOf: ref('01'),
    revisions: chain,
  };
  const other = { _id: 'x', status: 'draft' as const };

  it('drops the draft its live version links to', () => {
    expect(withoutLinkedRevisionDrafts([draft, live, other])).toEqual([
      live,
      other,
    ]);
  });

  it('keeps a draft no listed row links to', () => {
    expect(withoutLinkedRevisionDrafts([draft, other])).toEqual([draft, other]);
    expect(
      withoutLinkedRevisionDrafts([
        { ...draft, revisions: undefined },
        { ...live, revisions: undefined },
      ]),
    ).toHaveLength(2);
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
    'revised',
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

describe('quotationBuyerDecision', () => {
  const approvedAt = '2026-11-10T09:00:00Z';
  const rejectedAt = '2026-11-12T09:00:00Z';

  it('is null until the buyer acts', () => {
    expect(quotationBuyerDecision(undefined)).toBeNull();
    expect(
      quotationBuyerDecision({ approvedAt: null, rejectedAt: null }),
    ).toBeNull();
  });

  it('is accepted with only an approvedAt', () => {
    expect(quotationBuyerDecision({ approvedAt })).toEqual({
      decision: 'accepted',
      at: approvedAt,
    });
  });

  it('is rejected with only a rejectedAt', () => {
    expect(quotationBuyerDecision({ rejectedAt })).toEqual({
      decision: 'rejected',
      at: rejectedAt,
    });
  });

  it('takes the later date when both are set', () => {
    expect(quotationBuyerDecision({ approvedAt, rejectedAt })).toEqual({
      decision: 'rejected',
      at: rejectedAt,
    });
    expect(
      quotationBuyerDecision({
        approvedAt: rejectedAt,
        rejectedAt: approvedAt,
      }),
    ).toEqual({ decision: 'accepted', at: rejectedAt });
  });
});
