// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useRefetchDim } from '../useRefetchDim';

// A scope, as in a component: the composable cleans up via onScopeDispose.
const mount = (...args: Parameters<typeof useRefetchDim>) =>
  effectScope().run(() => useRefetchDim(...args))!;

describe('useRefetchDim', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('dims only after the refetch has run for the delay', async () => {
    const refetching = ref(false);
    const { dimmed } = mount(refetching);

    refetching.value = true;
    await nextTick();
    vi.advanceTimersByTime(199);
    expect(dimmed.value).toBe(false);

    vi.advanceTimersByTime(1);
    expect(dimmed.value).toBe(true);
  });

  it('never dims a refetch that ends within the delay', async () => {
    const refetching = ref(false);
    const { dimmed } = mount(refetching);

    refetching.value = true;
    await nextTick();
    vi.advanceTimersByTime(150);
    refetching.value = false;
    await nextTick();
    vi.advanceTimersByTime(500);
    expect(dimmed.value).toBe(false);
  });

  it('clears the dim as soon as the refetch ends', async () => {
    const refetching = ref(true);
    const { dimmed } = mount(refetching);
    vi.advanceTimersByTime(200);
    expect(dimmed.value).toBe(true);

    refetching.value = false;
    await nextTick();
    expect(dimmed.value).toBe(false);
  });

  it('takes a custom delay and a getter', async () => {
    const pending = ref(false);
    const { dimmed } = mount(() => pending.value, 50);

    pending.value = true;
    await nextTick();
    vi.advanceTimersByTime(50);
    expect(dimmed.value).toBe(true);
  });

  it('drops a pending timer when its scope is disposed', async () => {
    const refetching = ref(false);
    const scope = effectScope();
    const { dimmed } = scope.run(() => useRefetchDim(refetching))!;

    refetching.value = true;
    await nextTick();
    scope.stop();
    vi.advanceTimersByTime(500);
    expect(dimmed.value).toBe(false);
  });
});
