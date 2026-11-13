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
  canReviseQuotation,
  isAnsweredRequest,
  isQuotationDeletable,
  isQuotationEditable,
  isQuotationExternal,
  isReplacedVersion,
  isRevisionDraft,
  liveRevision,
  openRevisionDraft,
  replacingVersion,
  revisionSuffix,
  withoutLinkedRevisionDrafts,
  orderDetailsFormValues,
  orderDetailsRequest,
  quotationBuyerDecision,
  revisionSendBlock,
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

describe('canReviseQuotation', () => {
  it.each<QuotationStatus>(['requested', 'pending', 'expired'])(
    'revises %s',
    (status) => {
      expect(canReviseQuotation({ status })).toBe(true);
    },
  );

  it.each<QuotationStatus>([
    'requestDraft',
    'draft',
    'accepted',
    'confirmed',
    'finalized',
    'rejected',
    'canceled',
    'revised',
  ])('keeps %s', (status) => {
    expect(canReviseQuotation({ status })).toBe(false);
  });

  it('keeps an external quotation', () => {
    expect(canReviseQuotation({ status: 'pending', externalReference })).toBe(
      false,
    );
  });
});

describe('revisionSendBlock', () => {
  const sent = '2026-11-02T09:00:00Z';
  const draftOf = (
    status: QuotationStatus,
    validFrom: string | null,
    revision = 1,
  ) => ({
    status: 'draft' as const,
    revisionOf: { quotationId: 'src', quotationNumber: '2611-3-0018-01' },
    revisions: [
      {
        quotationId: 'draft',
        quotationNumber: '2611-3-0018-02',
        revision: revision + 1,
        status: 'draft' as const,
      },
      {
        quotationId: 'src',
        quotationNumber: '2611-3-0018-01',
        revision,
        status,
        validFrom,
      },
    ],
  });

  it.each<QuotationStatus>(['requested', 'pending', 'expired'])(
    'lets the draft be sent while its source is %s',
    (status) => {
      expect(revisionSendBlock(draftOf(status, sent))).toBeUndefined();
    },
  );

  it.each<QuotationStatus>(['accepted', 'confirmed', 'finalized', 'rejected'])(
    'blocks it when the buyer answered the offer (%s)',
    (status) => {
      expect(revisionSendBlock(draftOf(status, sent))?.reason).toBe(
        'versionAnswered',
      );
    },
  );

  it('blocks it when the offer was canceled', () => {
    const block = revisionSendBlock(draftOf('canceled', sent));
    expect(block?.reason).toBe('versionCanceled');
    expect(block?.source.revision).toBe(1);
  });

  it('tells a request apart by its missing validFrom', () => {
    expect(revisionSendBlock(draftOf('rejected', null, 0))?.reason).toBe(
      'requestWithdrawn',
    );
    expect(revisionSendBlock(draftOf('canceled', null, 0))?.reason).toBe(
      'requestCanceled',
    );
  });

  it('never blocks a quotation that is not a revision draft', () => {
    expect(
      revisionSendBlock({ ...draftOf('accepted', sent), status: 'pending' }),
    ).toBeUndefined();
    expect(revisionSendBlock({ status: 'draft' })).toBeUndefined();
  });

  it('leaves it to the API when the source is not in revisions', () => {
    expect(
      revisionSendBlock({ ...draftOf('accepted', sent), revisions: undefined }),
    ).toBeUndefined();
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

describe('versions', () => {
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
  // The request, two offers and an open draft, newest first
  const revisions = [
    version('q-03', 3, 'draft'),
    version('q-02', 2, 'pending'),
    version('q-01', 1, 'revised'),
    version('q-00', 0, 'revised'),
  ];

  describe('liveRevision', () => {
    it('is the newest version that is not a draft', () => {
      expect(liveRevision({ revisions })?.quotationId).toBe('q-02');
    });

    it('is none outside a chain', () => {
      expect(liveRevision({})).toBeUndefined();
      expect(liveRevision({ revisions: [] })).toBeUndefined();
    });
  });

  describe('isReplacedVersion', () => {
    it('is replaced when revised, or not the live version', () => {
      expect(isReplacedVersion({ _id: 'q-01', status: 'revised' })).toBe(true);
      expect(
        isReplacedVersion({
          _id: 'q-01',
          status: 'pending',
          revisedBy: { quotationId: 'q-02', quotationNumber: '2611-3-0018-02' },
        }),
      ).toBe(true);
      expect(
        isReplacedVersion({ _id: 'q-01', status: 'pending', revisions }),
      ).toBe(true);
    });

    it('is not replaced as the live version, a draft, or outside a chain', () => {
      expect(
        isReplacedVersion({ _id: 'q-02', status: 'pending', revisions }),
      ).toBe(false);
      expect(
        isReplacedVersion({ _id: 'q-03', status: 'draft', revisions }),
      ).toBe(false);
      expect(isReplacedVersion({ _id: 'q-09', status: 'pending' })).toBe(false);
    });
  });

  describe('replacingVersion', () => {
    it('is the live version, not the one that revised it', () => {
      expect(
        replacingVersion({
          _id: 'q-00',
          status: 'revised',
          revisedBy: { quotationId: 'q-01', quotationNumber: '2611-3-0018-01' },
          revisions,
        })?.quotationId,
      ).toBe('q-02');
    });

    it('falls back to the one that revised it without a chain', () => {
      const revisedBy = {
        quotationId: 'q-01',
        quotationNumber: '2611-3-0018-01',
      };
      expect(
        replacingVersion({ _id: 'q-00', status: 'revised', revisedBy }),
      ).toEqual(revisedBy);
    });

    it('is none on the live version', () => {
      expect(
        replacingVersion({ _id: 'q-02', status: 'pending', revisions }),
      ).toBeUndefined();
    });
  });

  it('formats the revision as a two-digit suffix', () => {
    expect(revisionSuffix(0)).toBe('00');
    expect(revisionSuffix(3)).toBe('03');
    expect(revisionSuffix(12)).toBe('12');
  });
});
