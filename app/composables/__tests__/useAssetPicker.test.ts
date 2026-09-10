import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { buildAsset } from '../../../test/fixtures';
import { useAssetPicker } from '../useAssetPicker';

// Module-level singleton state persists across calls, so each test must settle
// the picker (confirm/cancel) before the next one to avoid leaking `isOpen`.
describe('useAssetPicker', () => {
  it('resolves open() with the confirmed assets and closes', async () => {
    const { open, confirm, isOpen, options } = useAssetPicker();
    const picked = [buildAsset({ _id: 'a1' }), buildAsset({ _id: 'a2' })];

    const pending = open({ types: ['image'], title: 'Pick' });
    expect(isOpen.value).toBe(true);
    expect(options.value).toMatchObject({ types: ['image'], title: 'Pick' });

    confirm(picked);
    await expect(pending).resolves.toEqual(picked);
    await nextTick();
    expect(isOpen.value).toBe(false);
  });

  it('resolves open() with [] on cancel', async () => {
    const { open, cancel, isOpen } = useAssetPicker();

    const pending = open({ multiple: false });
    cancel();

    await expect(pending).resolves.toEqual([]);
    expect(isOpen.value).toBe(false);
  });

  it('ignores a second open() while already open and returns the same promise', async () => {
    const { open, confirm, options } = useAssetPicker();

    const first = open({ title: 'first' });
    const second = open({ title: 'second' });

    expect(second).toBe(first);
    // Options are not re-targeted by the ignored second call.
    expect(options.value.title).toBe('first');

    confirm([]);
    await first;
  });

  it('does not double-resolve when close fires after confirm', async () => {
    const { open, confirm, cancel } = useAssetPicker();
    const picked = [buildAsset({ _id: 'x' })];

    const pending = open();
    confirm(picked);
    // Trailing update:open=false from the sheet transition — must be a no-op.
    cancel();

    await expect(pending).resolves.toEqual(picked);
  });
});
