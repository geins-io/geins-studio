// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { QuotationOwner } from '#shared/types';
import {
  quotationOwnerOptions,
  quotationOwnerRequest,
  quotationOwnerText,
  savedQuotationOwnerRequest,
} from '../quotation-owner';

const reps = [
  { _id: 'johan@acme.se', name: 'Johan Berg' },
  { _id: 'lisa@acme.se', name: 'Lisa Ek' },
];

// A user owner has its username as _id; a free-text owner has only a name
const owner = (_id: string, name: string): QuotationOwner => ({
  _id,
  _type: 'owner',
  name,
  firstName: '',
  lastName: '',
  phone: '',
});

const linked = owner('lisa@acme.se', 'Lisa Ek');
const freeText = owner('', 'Maja Holm');
const none = owner('', '');

describe('quotationOwnerOptions', () => {
  it('adds a linked owner who is not one of the reps', () => {
    const outside = owner('anna@acme.se', 'Anna Lund');
    expect(quotationOwnerOptions(reps, outside)).toEqual([
      ...reps,
      { _id: 'anna@acme.se', name: 'Anna Lund' },
    ]);
  });

  it('keeps the reps as they are for a rep, a free-text owner or none', () => {
    expect(quotationOwnerOptions(reps, linked)).toBe(reps);
    expect(quotationOwnerOptions(reps, freeText)).toBe(reps);
    expect(quotationOwnerOptions(reps, none)).toBe(reps);
    expect(quotationOwnerOptions(reps, undefined)).toBe(reps);
  });
});

describe('quotationOwnerText', () => {
  it("shows a rep's current name over a stale snapshot", () => {
    const stale = { ...linked, name: 'Lisa Eklund' };
    expect(quotationOwnerText(stale, reps)).toBe('Lisa Ek');
  });

  it('shows the snapshot name for a free-text owner', () => {
    expect(quotationOwnerText(freeText, reps)).toBe('Maja Holm');
  });

  it('is empty with no owner', () => {
    expect(quotationOwnerText(undefined, reps)).toBe('');
    expect(quotationOwnerText(none, reps)).toBe('');
  });
});

describe('savedQuotationOwnerRequest', () => {
  it('sends only the id for a linked owner', () => {
    expect(savedQuotationOwnerRequest(linked)).toEqual({
      ownerId: 'lisa@acme.se',
      ownerName: undefined,
    });
  });

  it('sends only the name for a free-text owner', () => {
    expect(savedQuotationOwnerRequest(freeText)).toEqual({
      ownerId: undefined,
      ownerName: 'Maja Holm',
    });
  });

  it('sends neither with no owner', () => {
    expect(savedQuotationOwnerRequest(none)).toEqual({
      ownerId: undefined,
      ownerName: undefined,
    });
  });
});

describe('quotationOwnerRequest', () => {
  it('sends the id for an exact rep name, in any case', () => {
    expect(quotationOwnerRequest('  johan berg ', reps)).toEqual({
      ownerId: 'johan@acme.se',
      ownerName: undefined,
    });
  });

  it('sends other text, trimmed, as a free-text name', () => {
    expect(quotationOwnerRequest(' Johan ', reps)).toEqual({
      ownerId: undefined,
      ownerName: 'Johan',
    });
  });

  it('sends neither for blank text', () => {
    expect(quotationOwnerRequest('  ', reps)).toEqual({
      ownerId: undefined,
      ownerName: undefined,
    });
    expect(quotationOwnerRequest(null, reps, linked)).toEqual({
      ownerId: undefined,
      ownerName: undefined,
    });
  });

  it('keeps the saved owner while the text is unchanged', () => {
    expect(quotationOwnerRequest('Lisa Ek', reps, linked)).toEqual({
      ownerId: 'lisa@acme.se',
      ownerName: undefined,
    });
    expect(quotationOwnerRequest('Maja Holm', reps, freeText)).toEqual({
      ownerId: undefined,
      ownerName: 'Maja Holm',
    });
  });

  it('keeps a saved rep over another rep with the same name', () => {
    const twins = [
      { _id: 'lisa.e@acme.se', name: 'Lisa Ek' },
      { _id: 'lisa@acme.se', name: 'Lisa Ek' },
    ];
    expect(quotationOwnerRequest('Lisa Ek', twins, linked).ownerId).toBe(
      'lisa@acme.se',
    );
  });

  it('keeps a free-text owner that shares a rep name', () => {
    const named = owner('', 'Johan Berg');
    expect(quotationOwnerRequest('Johan Berg', reps, named)).toEqual({
      ownerId: undefined,
      ownerName: 'Johan Berg',
    });
  });

  it('keeps a linked owner who is not a rep', () => {
    const outside = owner('anna@acme.se', 'Anna Lund');
    const options = quotationOwnerOptions(reps, outside);
    expect(quotationOwnerRequest('Anna Lund', options, outside)).toEqual({
      ownerId: 'anna@acme.se',
      ownerName: undefined,
    });
  });

  it('sends a picked rep over a namesake rep or the saved owner', () => {
    const twins = [
      { _id: 'lisa.e@acme.se', name: 'Lisa Ek' },
      { _id: 'lisa@acme.se', name: 'Lisa Ek' },
    ];
    expect(
      quotationOwnerRequest('Lisa Ek', twins, undefined, twins[1]).ownerId,
    ).toBe('lisa@acme.se');
    expect(
      quotationOwnerRequest('Lisa Ek', twins, linked, twins[0]).ownerId,
    ).toBe('lisa.e@acme.se');
  });

  it('links a free-text owner to the rep picked under its name', () => {
    const named = owner('', 'Johan Berg');
    expect(quotationOwnerRequest('Johan Berg', reps, named, reps[0])).toEqual({
      ownerId: 'johan@acme.se',
      ownerName: undefined,
    });
  });

  it('ignores a pick once the text no longer shows it', () => {
    expect(quotationOwnerRequest('Johan B', reps, undefined, reps[0])).toEqual({
      ownerId: undefined,
      ownerName: 'Johan B',
    });
  });

  it('switches between a rep and a free-text name', () => {
    expect(quotationOwnerRequest('Maja Holm', reps, linked)).toEqual({
      ownerId: undefined,
      ownerName: 'Maja Holm',
    });
    expect(quotationOwnerRequest('Johan Berg', reps, freeText)).toEqual({
      ownerId: 'johan@acme.se',
      ownerName: undefined,
    });
  });
});
