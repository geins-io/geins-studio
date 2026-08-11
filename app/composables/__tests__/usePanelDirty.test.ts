import { describe, it, expect } from 'vitest';
import { nextTick, ref } from 'vue';
import { usePanelDirty } from '../usePanelDirty';

describe('usePanelDirty', () => {
  it('is not dirty before a baseline is captured', () => {
    const values = ref<Record<string, unknown>>({ name: 'a' });
    const { isDirty } = usePanelDirty(() => values.value);
    expect(isDirty.value).toBe(false);
  });

  it('is not dirty right after the baseline settles', async () => {
    const values = ref<Record<string, unknown>>({ name: '', tags: [] });
    const { isDirty, captureBaseline } = usePanelDirty(() => values.value);
    captureBaseline();
    await nextTick();
    expect(isDirty.value).toBe(false);
  });

  it('is dirty after a real change, clean again when reverted', async () => {
    const values = ref<Record<string, unknown>>({ name: 'a', tags: ['x'] });
    const { isDirty, captureBaseline } = usePanelDirty(() => values.value);
    captureBaseline();
    await nextTick();

    values.value = { name: 'b', tags: ['x'] };
    expect(isDirty.value).toBe(true);

    values.value = { name: 'a', tags: ['x'] };
    expect(isDirty.value).toBe(false);
  });

  it('ignores object key order', async () => {
    const values = ref<Record<string, unknown>>({ a: 1, b: 2 });
    const { isDirty, captureBaseline } = usePanelDirty(() => values.value);
    captureBaseline();
    await nextTick();

    values.value = { b: 2, a: 1 };
    expect(isDirty.value).toBe(false);
  });

  it('folds a settle-window change into the baseline (the STU-292 bug)', async () => {
    // Mimics a field that starts `undefined` and whose input emits `[]` on
    // mount (e.g. FormInputChannels) — must not count as a user edit.
    const values = ref<Record<string, unknown>>({ channels: undefined });
    const { isDirty, captureBaseline } = usePanelDirty(() => values.value);
    captureBaseline();
    values.value = { channels: [] };
    await nextTick();
    expect(isDirty.value).toBe(false);
  });
});
