import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { usePollWhile } from '../usePollWhile';

// A scope, as in a component: the composable cleans up via onScopeDispose.
const mount = (...args: Parameters<typeof usePollWhile>) => {
  const scope = effectScope();
  scope.run(() => usePollWhile(...args));
  return scope;
};

const setVisibility = async (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
  await nextTick();
};

describe('usePollWhile', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  });
  afterEach(async () => {
    await setVisibility('visible');
    vi.useRealTimers();
  });

  it('ticks on the interval only while active', async () => {
    const active = ref(true);
    const fn = vi.fn();
    mount(active, fn, 1000);

    await vi.advanceTimersByTimeAsync(3000);
    expect(fn).toHaveBeenCalledTimes(3);

    active.value = false;
    await nextTick();
    await vi.advanceTimersByTimeAsync(3000);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('pauses while the tab is hidden and resumes on the interval once visible', async () => {
    const fn = vi.fn();
    mount(true, fn, 1000);

    await setVisibility('hidden');
    await vi.advanceTimersByTimeAsync(5000);
    expect(fn).not.toHaveBeenCalled();

    await setVisibility('visible');
    expect(fn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("doesn't start in a tab that is hidden from the start", async () => {
    await setVisibility('hidden');
    const fn = vi.fn();
    mount(true, fn, 1000);

    await vi.advanceTimersByTimeAsync(5000);
    expect(fn).not.toHaveBeenCalled();
  });

  it("doesn't start when the tab becomes visible while inactive", async () => {
    const fn = vi.fn();
    mount(false, fn, 1000);

    await setVisibility('hidden');
    await setVisibility('visible');
    await vi.advanceTimersByTimeAsync(5000);
    expect(fn).not.toHaveBeenCalled();
  });

  it('keeps polling after a tick throws', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('offline'));
    mount(true, fn, 1000);

    await vi.advanceTimersByTimeAsync(2000);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('stops when its scope is disposed', async () => {
    const fn = vi.fn();
    const scope = mount(true, fn, 1000);

    scope.stop();
    await vi.advanceTimersByTimeAsync(3000);
    expect(fn).not.toHaveBeenCalled();
  });
});
