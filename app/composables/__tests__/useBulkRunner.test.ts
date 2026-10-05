/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BulkAction } from '#shared/types';

const { toast, geinsLogError } = vi.hoisted(() => ({
  toast: vi.fn(),
  geinsLogError: vi.fn(),
}));

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }));
mockNuxtImport('useGeinsLog', () => () => ({ geinsLogError }));

vi.mock('@/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}));

import { useBulkRunner } from '../useBulkRunner';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `a${i}`);

const action = (
  run: BulkAction['run'] = vi.fn().mockResolvedValue(undefined),
): BulkAction => ({
  key: 'trash',
  label: 'Move to trash',
  icon: 'Trash2',
  run,
  successMessage: (count) => `done ${count}`,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useBulkRunner', () => {
  it('keeps the global error toast for a single chunk', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    await useBulkRunner().run(action(run), ids(3), undefined, 'asset');
    expect(run).toHaveBeenCalledWith(ids(3), undefined, {});
    expect(toast).toHaveBeenCalledWith({
      title: 'done 3',
      variant: 'positive',
    });
  });

  it('silences per-call toasts and chunks by 100 when there are several chunks', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const result = await useBulkRunner().run(
      action(run),
      ids(150),
      'v',
      'asset',
    );
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[0]![0]).toHaveLength(100);
    expect(run.mock.calls[1]![0]).toHaveLength(50);
    expect(run.mock.calls[0]![2]).toEqual({ suppressErrorToast: true });
    expect(result.failed).toEqual([]);
    expect(toast).toHaveBeenCalledWith({
      title: 'done 150',
      variant: 'positive',
    });
  });

  it('gives one summary toast on a partial failure across chunks', async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce({ data: { title: 'Assets not found.' } });
    const result = await useBulkRunner().run(
      action(run),
      ids(150),
      undefined,
      'asset',
    );
    expect(result.succeeded).toHaveLength(100);
    expect(result.failed).toEqual(ids(150).slice(100));
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith({
      title: 'bulk_action_partial',
      description: 'Assets not found. bulk_action_failed_kept',
      variant: 'negative',
    });
  });

  it('adds no toast of its own when the only chunk fails', async () => {
    const run = vi.fn().mockRejectedValue(new Error('boom'));
    const result = await useBulkRunner().run(
      action(run),
      ids(2),
      undefined,
      'asset',
    );
    expect(result.failed).toEqual(ids(2));
    expect(toast).not.toHaveBeenCalled();
    expect(geinsLogError).toHaveBeenCalled();
  });
});
