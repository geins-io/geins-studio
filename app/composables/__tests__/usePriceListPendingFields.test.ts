// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { usePriceListPendingFields } from '../pricing/usePriceListPendingFields';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('usePriceListPendingFields', () => {
  it("marks the row's other two price fields while the preview runs", async () => {
    const { isFieldPending, trackEdit } = usePriceListPendingFields();
    const preview = deferred();
    const tracked = trackEdit('p1', 'margin', () => preview.promise);

    expect(isFieldPending('p1', 'price')).toBe(true);
    expect(isFieldPending('p1', 'discountPercent')).toBe(true);
    expect(isFieldPending('p1', 'margin')).toBe(false);
    expect(isFieldPending('p2', 'price')).toBe(false);

    preview.resolve();
    await tracked;
    expect(isFieldPending('p1', 'price')).toBe(false);
  });

  it('clears after a failed preview', async () => {
    const { isFieldPending, trackEdit } = usePriceListPendingFields();
    const preview = deferred();
    const tracked = trackEdit('p1', 'price', () => preview.promise);

    preview.reject(new Error('preview failed'));
    await expect(tracked).rejects.toThrow('preview failed');
    expect(isFieldPending('p1', 'margin')).toBe(false);
    expect(isFieldPending('p1', 'discountPercent')).toBe(false);
  });

  it('keeps a newer edit of the row until its own preview settles', async () => {
    const { isFieldPending, trackEdit } = usePriceListPendingFields();
    const first = deferred();
    const second = deferred();
    const firstTracked = trackEdit('p1', 'margin', () => first.promise);
    const secondTracked = trackEdit('p1', 'price', () => second.promise);

    first.resolve();
    await firstTracked;
    expect(isFieldPending('p1', 'margin')).toBe(true);
    expect(isFieldPending('p1', 'price')).toBe(false);

    second.resolve();
    await secondTracked;
    expect(isFieldPending('p1', 'margin')).toBe(false);
  });

  it('tracks rows apart', async () => {
    const { isFieldPending, trackEdit } = usePriceListPendingFields();
    const first = deferred();
    const second = deferred();
    const firstTracked = trackEdit('p1', 'margin', () => first.promise);
    trackEdit('p2', 'margin', () => second.promise);

    first.resolve();
    await firstTracked;
    expect(isFieldPending('p1', 'price')).toBe(false);
    expect(isFieldPending('p2', 'price')).toBe(true);
    second.resolve();
  });
});
