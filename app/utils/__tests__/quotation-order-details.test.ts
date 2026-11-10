// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuotationOrderDetails } from '#shared/types';
import { createOrderDetailsSchema } from '../quotation-order-details';

const t = (key: string) => key;
const empty = {
  goodsLabel: '',
  customerOrderNumber: '',
  desiredDeliveryDate: '',
  customerReference: '',
};

function errors(
  values: Partial<typeof empty>,
  stored?: QuotationOrderDetails,
): Record<string, string> {
  const result = createOrderDetailsSchema(t, () => stored).safeParse({
    ...empty,
    ...values,
  });
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
}

describe('createOrderDetailsSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts no order details at all', () => {
    expect(errors({})).toEqual({});
  });

  it('caps each text field at the API limit', () => {
    expect(
      errors({
        goodsLabel: 'x'.repeat(501),
        customerOrderNumber: 'x'.repeat(31),
        customerReference: 'x'.repeat(201),
      }),
    ).toEqual({
      goodsLabel: 'form.max_characters',
      customerOrderNumber: 'form.max_characters',
      customerReference: 'form.max_characters',
    });
    expect(
      errors({
        goodsLabel: 'x'.repeat(500),
        customerOrderNumber: 'x'.repeat(30),
        customerReference: 'x'.repeat(200),
      }),
    ).toEqual({});
  });

  it('refuses to clear a stored value', () => {
    const stored = {
      goodsLabel: 'Project Alpha',
      desiredDeliveryDate: '2026-11-20T00:00:00Z',
    };
    expect(errors({ goodsLabel: '  ' }, stored)).toEqual({
      goodsLabel: 'orders.order_details_cannot_clear',
      desiredDeliveryDate: 'orders.order_details_cannot_clear',
    });
  });

  it('wants a new delivery date after today', () => {
    expect(
      errors({ desiredDeliveryDate: new Date('2026-11-10').toISOString() }),
    ).toEqual({ desiredDeliveryDate: 'orders.delivery_date_in_future' });
    expect(
      errors({ desiredDeliveryDate: new Date('2026-11-11').toISOString() }),
    ).toEqual({});
  });

  it('lets an unchanged past delivery date stand', () => {
    const stored = { desiredDeliveryDate: '2026-11-01T00:00:00Z' };
    expect(
      errors(
        { desiredDeliveryDate: new Date('2026-11-01').toISOString() },
        stored,
      ),
    ).toEqual({});
  });
});
