// @vitest-environment node
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { computed, nextTick, reactive } from 'vue';
import type { DashboardBoard } from '#shared/types';
import {
  DASHBOARD_TEMPLATES,
  createDashboardBoard,
  defaultDashboardBoard,
  packDashboardBoard,
} from '@/lib/dashboard';
import { useDashboard } from '../dashboard/useDashboard';

const storage = vi.hoisted(() => ({
  state: null as null | {
    key: string | null;
    stored: DashboardBoard | null;
    saved: DashboardBoard[];
    cleared: number;
  },
}));

mockNuxtImport('useDashboardStorage', () => () => ({
  storageKey: computed(() => storage.state!.key),
  load: () => storage.state!.stored,
  save: (board: DashboardBoard) =>
    storage.state!.saved.push(JSON.parse(JSON.stringify(board))),
  clear: () => {
    storage.state!.cleared++;
  },
}));

const defaultTypes = () =>
  defaultDashboardBoard().items.map((item) => item.type);

const quickAccessId = (items: DashboardBoard['items']) =>
  items.find((item) => item.type === 'quick-access')!.i;

const snapshotOf = (dashboard: ReturnType<typeof useDashboard>) =>
  JSON.parse(
    JSON.stringify({
      items: dashboard.items.value,
      layout: dashboard.layout.value,
    }),
  );

beforeEach(() => {
  storage.state = reactive({ key: null, stored: null, saved: [], cleared: 0 });
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
    expect(dashboard.items.value).toHaveLength(before.items.length + 1);
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
    expect(saved.items).toHaveLength(defaultTypes().length + 1);
    expect(saved.layout.at(-1)).toMatchObject({ x: 4, y: 0 });
  });

  it('starts editing when adding outside edit mode, so cancel still works', () => {
    const dashboard = useDashboard();
    dashboard.addWidget('quick-access');

    expect(dashboard.editing.value).toBe(true);
    dashboard.cancelEdit();
    expect(dashboard.items.value).toHaveLength(defaultTypes().length);
  });
});

describe('useDashboard saved board', () => {
  const saved = createDashboardBoard([['list-company-orders', 0, 0, 6, 8]]);

  it('shows the saved board once user and account are known', async () => {
    storage.state!.stored = saved;
    const dashboard = useDashboard();
    expect(dashboard.items.value).toHaveLength(defaultTypes().length);

    storage.state!.key = 'geins-dashboard-acme-u1';
    await nextTick();

    expect(snapshotOf(dashboard)).toEqual(saved);
  });

  it('starts from the default board when nothing is saved', () => {
    storage.state!.key = 'geins-dashboard-acme-u1';
    const dashboard = useDashboard();
    expect(dashboard.items.value.map((item) => item.type)).toEqual(
      defaultTypes(),
    );
  });

  it('saves widget settings right away, and keeps them through cancel', () => {
    storage.state!.key = 'geins-dashboard-acme-u1';
    const dashboard = useDashboard();
    const quickAccess = quickAccessId(dashboard.items.value);
    const y = dashboard.layout.value[1]!.y;

    dashboard.startEdit();
    dashboard.layout.value[1]!.y = y + 5;
    dashboard.updateWidgetConfig(quickAccess, { shortcuts: ['companies'] });

    // Saved: the last saved layout with the new settings, not the edit
    const lastSave = storage.state!.saved.at(-1)!;
    expect(lastSave.layout[1]!.y).toBe(y);
    expect(
      lastSave.items.find((item) => item.i === quickAccess)!.config,
    ).toEqual({ shortcuts: ['companies'] });

    dashboard.cancelEdit();
    expect(dashboard.layout.value[1]!.y).toBe(y);
    expect(
      dashboard.items.value.find((item) => item.i === quickAccess)!.config,
    ).toEqual({ shortcuts: ['companies'] });
  });

  it('saves nothing on done without a change', () => {
    storage.state!.key = 'geins-dashboard-acme-u1';
    storage.state!.stored = saved;
    const dashboard = useDashboard();
    dashboard.startEdit();
    dashboard.doneEdit();

    expect(storage.state!.saved).toHaveLength(0);
    expect(storage.state!.cleared).toBe(0);
  });

  it('fits a widget height without saving it, and keeps it through cancel', () => {
    storage.state!.key = 'geins-dashboard-acme-u1';
    const dashboard = useDashboard();
    const id = quickAccessId(dashboard.items.value);
    const heightOf = () =>
      dashboard.layout.value.find((position) => position.i === id)!.h;
    const h = heightOf();
    const before = dashboard.layout.value;

    dashboard.startEdit();
    dashboard.fitWidget(id, h + 2);

    // A new array, so the grid compacts the widgets below
    expect(dashboard.layout.value).not.toBe(before);
    expect(heightOf()).toBe(h + 2);

    dashboard.cancelEdit();
    expect(heightOf()).toBe(h + 2);
    expect(storage.state!.saved).toHaveLength(0);
  });

  it('leaves the layout alone when the fitted height is already set', () => {
    const dashboard = useDashboard();
    const { i, h } = dashboard.layout.value[0]!;
    const before = dashboard.layout.value;

    dashboard.fitWidget(i, h);
    expect(dashboard.layout.value).toBe(before);
  });
});

describe('useDashboard default board', () => {
  const KEY = 'geins-dashboard-acme-u1';
  // An old saved board: one widget, with its own settings
  const saved = createDashboardBoard([['quick-access', 0, 0, 6, 4]]);
  saved.items[0]!.config = { shortcuts: ['companies'] };

  it('puts the default board back on the empty board and clears the saved one', () => {
    storage.state!.key = KEY;
    storage.state!.stored = { items: [], layout: [] };
    const dashboard = useDashboard();
    expect(dashboard.items.value).toHaveLength(0);

    dashboard.resetToDefault();

    expect(dashboard.items.value.map((item) => item.type)).toEqual(
      defaultTypes(),
    );
    expect(dashboard.isDefault.value).toBe(true);
    expect(storage.state!.cleared).toBe(1);
    expect(storage.state!.saved).toHaveLength(0);
  });

  it('brings the old board and its settings back on cancel after a reset', async () => {
    storage.state!.stored = saved;
    const dashboard = useDashboard();
    storage.state!.key = KEY;
    await nextTick();
    expect(dashboard.isDefault.value).toBe(false);

    dashboard.startEdit();
    dashboard.resetToDefault();

    expect(dashboard.editing.value).toBe(true);
    expect(dashboard.isDefault.value).toBe(true);

    dashboard.cancelEdit();

    expect(snapshotOf(dashboard)).toEqual(saved);
    expect(storage.state!.saved).toHaveLength(0);
    expect(storage.state!.cleared).toBe(0);
  });

  it('clears the saved board on done after a reset', async () => {
    storage.state!.stored = saved;
    const dashboard = useDashboard();
    storage.state!.key = KEY;
    await nextTick();

    dashboard.startEdit();
    dashboard.resetToDefault();
    dashboard.doneEdit();

    expect(dashboard.editing.value).toBe(false);
    expect(dashboard.items.value.map((item) => item.type)).toEqual(
      defaultTypes(),
    );
    expect(storage.state!.cleared).toBe(1);
    expect(storage.state!.saved).toHaveLength(0);
  });

  it('clears instead of saving on done with a board edited back to the default', () => {
    storage.state!.key = KEY;
    const dashboard = useDashboard();
    const y = dashboard.layout.value[0]!.y;

    dashboard.startEdit();
    dashboard.layout.value[0]!.y = y + 30;
    expect(dashboard.isDefault.value).toBe(false);
    dashboard.doneEdit();
    expect(storage.state!.saved).toHaveLength(1);

    dashboard.startEdit();
    dashboard.layout.value[0]!.y = y;
    dashboard.doneEdit();

    expect(storage.state!.saved).toHaveLength(1);
    expect(storage.state!.cleared).toBe(1);
  });

  it('still sees the default when a fitted height moves the widgets below', () => {
    storage.state!.key = KEY;
    const dashboard = useDashboard();
    const id = quickAccessId(dashboard.items.value);
    const { y, h } = dashboard.layout.value.find((p) => p.i === id)!;

    dashboard.fitWidget(id, h + 1);
    // What the grid does with the taller widget
    for (const position of dashboard.layout.value) {
      if (position.y >= y + h) position.y += 1;
    }

    expect(dashboard.isDefault.value).toBe(true);
    dashboard.startEdit();
    dashboard.resetToDefault();
    dashboard.doneEdit();
    expect(storage.state!.saved).toHaveLength(0);
    expect(storage.state!.cleared).toBe(1);
  });
});

describe('useDashboard templates', () => {
  const KEY = 'geins-dashboard-acme-u1';
  const admin = DASHBOARD_TEMPLATES.find((t) => t.id === 'admin')!;

  it('fills the empty board with a template and saves it', () => {
    storage.state!.key = KEY;
    storage.state!.stored = { items: [], layout: [] };
    const dashboard = useDashboard();

    dashboard.applyTemplate(admin);

    const board = packDashboardBoard(admin.types);
    expect(snapshotOf(dashboard)).toEqual(board);
    expect(dashboard.editing.value).toBe(false);
    expect(dashboard.isDefault.value).toBe(false);
    expect(storage.state!.saved).toEqual([board]);
    expect(storage.state!.cleared).toBe(0);
  });

  it('loads the saved template board again after a reload', () => {
    storage.state!.key = KEY;
    storage.state!.stored = { items: [], layout: [] };
    useDashboard().applyTemplate(admin);

    storage.state!.stored = storage.state!.saved.at(-1)!;
    const reloaded = useDashboard();

    expect(snapshotOf(reloaded)).toEqual(packDashboardBoard(admin.types));
  });

  it('applies a template inside the edit session: cancel takes it back', () => {
    storage.state!.key = KEY;
    storage.state!.stored = { items: [], layout: [] };
    const dashboard = useDashboard();

    dashboard.startEdit();
    dashboard.applyTemplate(admin);
    expect(dashboard.items.value).toHaveLength(admin.types.length);
    expect(storage.state!.saved).toHaveLength(0);

    dashboard.cancelEdit();

    expect(dashboard.items.value).toHaveLength(0);
    expect(storage.state!.saved).toHaveLength(0);
  });

  it('saves a template applied inside the edit session on done', () => {
    storage.state!.key = KEY;
    storage.state!.stored = { items: [], layout: [] };
    const dashboard = useDashboard();

    dashboard.startEdit();
    dashboard.applyTemplate(admin);
    dashboard.doneEdit();

    expect(storage.state!.saved).toEqual([packDashboardBoard(admin.types)]);
    expect(storage.state!.cleared).toBe(0);
  });
});
