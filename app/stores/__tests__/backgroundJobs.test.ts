/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import type { BackgroundJob, BackgroundJobStart } from '#shared/types';

const { session } = vi.hoisted(() => ({
  session: { value: { accountKey: 'acc1' } as { accountKey?: string } | null },
}));

mockNuxtImport('useGeinsAuth', () => () => ({ session: ref(session.value) }));

import {
  BACKGROUND_JOB_KEEP_MS,
  BACKGROUND_JOB_RESUME_MS,
  useBackgroundJobsStore,
} from '../backgroundJobs';

const KEY = 'geins-background-jobs:acc1';

const start: BackgroundJobStart = {
  spec: { kind: 'move', moveIds: ['m1'] },
  label: { key: 'asset_library.job_moving', params: { count: 2 }, plural: 2 },
  doneMessage: { key: 'asset_library.bulk_moved_to_folder' },
  refreshKeys: ['asset-library-list'],
};

const stored = (): BackgroundJob[] =>
  JSON.parse(localStorage.getItem(KEY) ?? '[]');

describe('background jobs store', () => {
  beforeEach(() => {
    session.value = { accountKey: 'acc1' };
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('adds a pending job and persists it per account', () => {
    const store = useBackgroundJobsStore();
    const job = store.add(start);
    expect(job).toMatchObject({ ...start, state: 'pending' });
    expect(store.pending).toHaveLength(1);
    expect(stored().map((j) => j.id)).toEqual([job.id]);
  });

  it('keeps only pending jobs in storage', () => {
    const store = useBackgroundJobsStore();
    const job = store.add(start);
    store.update(job.id, { state: 'completed' });
    expect(store.jobs[0]?.state).toBe('completed');
    expect(store.hasFinished).toBe(true);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('restores young pending jobs and drops stale ones', () => {
    const now = Date.now();
    const job = (id: string, startedAt: number): BackgroundJob => ({
      ...start,
      id,
      state: 'pending',
      startedAt,
    });
    localStorage.setItem(
      KEY,
      JSON.stringify([
        job('young', now - 1000),
        job('stale', now - BACKGROUND_JOB_RESUME_MS - 1),
      ]),
    );
    const store = useBackgroundJobsStore();
    store.restore(now);
    expect(store.jobs.map((j) => j.id)).toEqual(['young']);
    expect(stored().map((j) => j.id)).toEqual(['young']);
  });

  it('ignores unreadable storage', () => {
    localStorage.setItem(KEY, '{not json');
    const store = useBackgroundJobsStore();
    store.restore();
    expect(store.jobs).toEqual([]);
  });

  it('does not persist without an account', () => {
    session.value = null;
    const store = useBackgroundJobsStore();
    store.add(start);
    expect(localStorage.length).toBe(0);
  });

  it('clears finished jobs and resets in memory only', () => {
    const store = useBackgroundJobsStore();
    const done = store.add(start);
    store.add(start);
    store.update(done.id, { state: 'timeout' });
    store.clearFinished();
    expect(store.jobs).toHaveLength(1);
    store.panelOpen = true;
    store.reset();
    expect(store.jobs).toEqual([]);
    expect(store.panelOpen).toBe(false);
    expect(stored()).toHaveLength(1);
  });

  it('versions a replaced file by its bare URL', () => {
    const store = useBackgroundJobsStore();
    expect(store.fileVersion('https://cdn.test/a.jpg')).toBeUndefined();
    store.markFileReplaced('https://cdn.test/a.jpg?v=1', 42);
    expect(store.fileVersion('https://cdn.test/a.jpg?v=2')).toBe(42);
    expect(store.fileVersion(null)).toBeUndefined();
  });

  it('expires finished jobs after the keep window, but not while the panel is open', () => {
    const store = useBackgroundJobsStore();
    const done = store.add(start);
    const running = store.add(start);
    store.update(done.id, { state: 'completed' });
    const finishedAt = store.jobs[0]?.finishedAt ?? 0;
    expect(finishedAt).toBeGreaterThan(0);

    store.expireFinished(finishedAt + BACKGROUND_JOB_KEEP_MS - 1);
    expect(store.jobs).toHaveLength(2);

    store.panelOpen = true;
    store.expireFinished(finishedAt + BACKGROUND_JOB_KEEP_MS);
    expect(store.jobs).toHaveLength(2);

    store.panelOpen = false;
    store.expireFinished(finishedAt + BACKGROUND_JOB_KEEP_MS);
    expect(store.jobs.map((j) => j.id)).toEqual([running.id]);
  });
});
