// @vitest-environment node
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { computed, nextTick, reactive } from 'vue';
import type { DashboardBoard } from '#shared/types';
import { createDashboardBoard } from '@/lib/dashboard';
import { useDashboard } from '../dashboard/useDashboard';

const storage = vi.hoisted(() => ({
  state: null as null | {
    key: string | null;
    stored: DashboardBoard | null;
    saved: DashboardBoard[];
  },
}));

mockNuxtImport('useDashboardStorage', () => () => ({
  storageKey: computed(() => storage.state!.key),
  load: () => storage.state!.stored,
  save: (board: DashboardBoard) =>
    storage.state!.saved.push(JSON.parse(JSON.stringify(board))),
}));

const snapshotOf = (dashboard: ReturnType<typeof useDashboard>) =>
  JSON.parse(
    JSON.stringify({
      items: dashboard.items.value,
      layout: dashboard.layout.value,
    }),
  );

beforeEach(() => {
  storage.state = reactive({ key: null, stored: null, saved: [] });
});

describe('useDashboard edit session', () => {
  it('restores the board exactly on cancel, without saving', () => {
    const dashboard = useDashboard();
    const before = snapshotOf(dashboard);

    dashboard.startEdit();
    // The grid moves layout items in place while dragging
    dashboard.layout.value[0]!.y = 7;
    dashboard.removeWidget(dashboard.items.value[1]!.i);
    dashboard.cancelEdit();

    expect(dashboard.editing.value).toBe(false);
    expect(snapshotOf(dashboard)).toEqual(before);
    expect(storage.state!.saved).toHaveLength(0);
  });

  it('keeps and saves the changes on done', () => {
    const dashboard = useDashboard();
    dashboard.startEdit();
    dashboard.layout.value[0]!.y = 7;
    dashboard.doneEdit();

    expect(dashboard.editing.value).toBe(false);
    expect(dashboard.layout.value[0]!.y).toBe(7);
    expect(storage.state!.saved.at(-1)!.layout[0]!.y).toBe(7);
  });

  it('removes a widget together with its layout entry', () => {
    const dashboard = useDashboard();
    const removed = dashboard.items.value[0]!.i;
    dashboard.startEdit();
    dashboard.removeWidget(removed);

    expect(dashboard.items.value.some((item) => item.i === removed)).toBe(
      false,
    );
    expect(dashboard.layout.value.some((l) => l.i === removed)).toBe(false);
  });

  it('ignores a second start, so cancel still goes back to the first copy', () => {
    const dashboard = useDashboard();
    const y = dashboard.layout.value[0]!.y;
    dashboard.startEdit();
    dashboard.layout.value[0]!.y = y + 3;
    dashboard.startEdit();
    dashboard.cancelEdit();

    expect(dashboard.layout.value[0]!.y).toBe(y);
  });
});

describe('useDashboard adding widgets', () => {
  it('takes an added widget back off on cancel, without saving', () => {
    storage.state!.key = 'geins-dashboard-acme-u1';
    const dashboard = useDashboard();
    const before = snapshotOf(dashboard);

    dashboard.startEdit();
    dashboard.addWidget('quick-access');
    expect(dashboard.items.value).toHaveLength(3);
    dashboard.cancelEdit();

    expect(snapshotOf(dashboard)).toEqual(before);
    expect(storage.state!.saved).toHaveLength(0);
  });

  it('saves an added widget on done', () => {
    storage.state!.key = 'geins-dashboard-acme-u1';
    const dashboard = useDashboard();
    dashboard.startEdit();
    dashboard.addWidget('list-company-orders', { x: 4, y: 0 });
    dashboard.doneEdit();

    const saved = storage.state!.saved.at(-1)!;
    expect(saved.items).toHaveLength(3);
    expect(saved.layout.at(-1)).toMatchObject({ x: 4, y: 0 });
  });

  it('starts editing when adding outside edit mode, so cancel still works', () => {
    const dashboard = useDashboard();
    dashboard.addWidget('quick-access');

    expect(dashboard.editing.value).toBe(true);
    dashboard.cancelEdit();
    expect(dashboard.items.value).toHaveLength(2);
  });
});

describe('useDashboard saved board', () => {
  const saved = createDashboardBoard([['list-company-orders', 0, 0, 6, 8]]);

  it('shows the saved board once user and account are known', async () => {
    storage.state!.stored = saved;
    const dashboard = useDashboard();
    expect(dashboard.items.value).toHaveLength(2);

    storage.state!.key = 'geins-dashboard-acme-u1';
    await nextTick();

    expect(snapshotOf(dashboard)).toEqual(saved);
  });

  it('starts from the default board when nothing is saved', () => {
    storage.state!.key = 'geins-dashboard-acme-u1';
    const dashboard = useDashboard();
    expect(dashboard.items.value.map((item) => item.type)).toEqual([
      'quick-access',
      'list-company-orders',
    ]);
  });

  it('saves widget settings right away, and keeps them through cancel', () => {
    storage.state!.key = 'geins-dashboard-acme-u1';
    const dashboard = useDashboard();
    const quickAccess = dashboard.items.value[0]!.i;
    const y = dashboard.layout.value[1]!.y;

    dashboard.startEdit();
    dashboard.layout.value[1]!.y = y + 5;
    dashboard.updateWidgetConfig(quickAccess, { shortcuts: ['companies'] });

    // Saved: the last saved layout with the new settings, not the edit
    const lastSave = storage.state!.saved.at(-1)!;
    expect(lastSave.layout[1]!.y).toBe(y);
    expect(lastSave.items[0]!.config).toEqual({ shortcuts: ['companies'] });

    dashboard.cancelEdit();
    expect(dashboard.layout.value[1]!.y).toBe(y);
    expect(dashboard.items.value[0]!.config).toEqual({
      shortcuts: ['companies'],
    });
  });

  it('saves nothing on done without a change', () => {
    storage.state!.key = 'geins-dashboard-acme-u1';
    const dashboard = useDashboard();
    dashboard.startEdit();
    dashboard.doneEdit();

    expect(storage.state!.saved).toHaveLength(0);
  });

  it('fits a widget height without saving it, and keeps it through cancel', () => {
    storage.state!.key = 'geins-dashboard-acme-u1';
    const dashboard = useDashboard();
    const quickAccess = dashboard.layout.value[0]!;
    const before = dashboard.layout.value;

    dashboard.startEdit();
    dashboard.fitWidget(quickAccess.i, quickAccess.h + 2);

    // A new array, so the grid compacts the widgets below
    expect(dashboard.layout.value).not.toBe(before);
    expect(dashboard.layout.value[0]!.h).toBe(quickAccess.h + 2);

    dashboard.cancelEdit();
    expect(dashboard.layout.value[0]!.h).toBe(quickAccess.h + 2);
    expect(storage.state!.saved).toHaveLength(0);
  });

  it('leaves the layout alone when the fitted height is already set', () => {
    const dashboard = useDashboard();
    const { i, h } = dashboard.layout.value[0]!;
    const before = dashboard.layout.value;

    dashboard.fitWidget(i, h);
    expect(dashboard.layout.value).toBe(before);
  });

  it('puts the default board back and saves it', () => {
    storage.state!.key = 'geins-dashboard-acme-u1';
    storage.state!.stored = { items: [], layout: [] };
    const dashboard = useDashboard();
    expect(dashboard.items.value).toHaveLength(0);

    dashboard.resetToDefault();

    expect(dashboard.items.value.map((item) => item.type)).toEqual([
      'quick-access',
      'list-company-orders',
    ]);
    expect(storage.state!.saved.at(-1)!.items).toHaveLength(2);
  });
});
