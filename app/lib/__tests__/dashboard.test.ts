// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { DashboardLayoutItem } from '#shared/types';
import {
  DASHBOARD_GRID_COLUMNS,
  DASHBOARD_WIDGETS,
  DEFAULT_QUICK_ACCESS_SHORTCUTS,
  QUICK_ACCESS_SHORTCUTS,
  cloneDashboardBoard,
  dashboardStorageKey,
  defaultDashboardBoard,
  greetingPeriod,
  isDashboardWidgetType,
  parseStoredDashboards,
  pixelsToRows,
  quickAccessColumns,
  quickAccessShortcutIds,
  removeDashboardWidget,
  rowsToPixels,
  serializeDashboards,
  stackedOrder,
} from '../dashboard';

const overlaps = (a: DashboardLayoutItem, b: DashboardLayoutItem) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('defaultDashboardBoard', () => {
  const board = defaultDashboardBoard();

  it('pairs every widget with exactly one layout entry', () => {
    expect(board.items.map((item) => item.i).sort()).toEqual(
      board.layout.map((position) => position.i).sort(),
    );
    expect(new Set(board.items.map((item) => item.i)).size).toBe(
      board.items.length,
    );
  });

  it('fits the grid and respects each widget’s minimum size', () => {
    for (const position of board.layout) {
      const item = board.items.find((it) => it.i === position.i)!;
      const { size } = DASHBOARD_WIDGETS[item.type];
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.x + position.w).toBeLessThanOrEqual(
        DASHBOARD_GRID_COLUMNS,
      );
      expect(position.w).toBeGreaterThanOrEqual(size.minW);
      expect(position.h).toBeGreaterThanOrEqual(size.minH);
    }
  });

  it('has no overlapping widgets', () => {
    const { layout } = board;
    for (let a = 0; a < layout.length; a++) {
      for (let b = a + 1; b < layout.length; b++) {
        expect(overlaps(layout[a]!, layout[b]!)).toBe(false);
      }
    }
  });

  it('returns a fresh board each call', () => {
    expect(defaultDashboardBoard()).not.toBe(board);
    expect(defaultDashboardBoard().layout[0]).not.toBe(board.layout[0]);
  });
});

describe('stackedOrder', () => {
  it('orders top to bottom, then left to right, without mutating', () => {
    const layout: DashboardLayoutItem[] = [
      { i: 'c', x: 0, y: 10, w: 4, h: 4 },
      { i: 'b', x: 8, y: 0, w: 4, h: 4 },
      { i: 'a', x: 0, y: 0, w: 8, h: 10 },
    ];
    expect(stackedOrder(layout).map((l) => l.i)).toEqual(['a', 'b', 'c']);
    expect(layout.map((l) => l.i)).toEqual(['c', 'b', 'a']);
  });
});

describe('rowsToPixels', () => {
  it('counts the gaps between rows', () => {
    expect(rowsToPixels(1)).toBe(28);
    expect(rowsToPixels(10)).toBe(10 * 28 + 9 * 16);
  });
});

describe('pixelsToRows', () => {
  it('gives the fewest rows that hold the height, gaps included', () => {
    for (let rows = 1; rows <= 12; rows++) {
      expect(pixelsToRows(rowsToPixels(rows))).toBe(rows);
      expect(pixelsToRows(rowsToPixels(rows) + 1)).toBe(rows + 1);
    }
    expect(pixelsToRows(0)).toBe(1);
  });

  it('ignores sub-pixel measuring noise', () => {
    expect(pixelsToRows(rowsToPixels(4) + 0.01)).toBe(4);
  });
});

describe('greetingPeriod', () => {
  it('splits the day at noon and 18:00', () => {
    expect(greetingPeriod(new Date(2026, 10, 24, 0, 0))).toBe('morning');
    expect(greetingPeriod(new Date(2026, 10, 24, 11, 59))).toBe('morning');
    expect(greetingPeriod(new Date(2026, 10, 24, 12, 0))).toBe('afternoon');
    expect(greetingPeriod(new Date(2026, 10, 24, 17, 59))).toBe('afternoon');
    expect(greetingPeriod(new Date(2026, 10, 24, 18, 0))).toBe('evening');
  });
});

describe('isDashboardWidgetType', () => {
  it('accepts registry types only', () => {
    expect(isDashboardWidgetType('quick-access')).toBe(true);
    expect(isDashboardWidgetType('toString')).toBe(false);
    expect(isDashboardWidgetType(undefined)).toBe(false);
  });
});

describe('quick access', () => {
  it('defaults to shortcuts that exist', () => {
    const ids = QUICK_ACCESS_SHORTCUTS.map((s) => s.id);
    expect(DEFAULT_QUICK_ACCESS_SHORTCUTS.every((id) => ids.includes(id))).toBe(
      true,
    );
  });

  it('fits columns to the width, at most one per shortcut', () => {
    expect(quickAccessColumns(0, 4)).toBe(1);
    expect(quickAccessColumns(400, 4)).toBe(2);
    expect(quickAccessColumns(2000, 4)).toBe(4);
    expect(quickAccessColumns(2000, 0)).toBe(1);
  });

  it('has unique shortcut ids', () => {
    const ids = QUICK_ACCESS_SHORTCUTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('shows the default without a saved choice', () => {
    expect(quickAccessShortcutIds(undefined)).toEqual(
      DEFAULT_QUICK_ACCESS_SHORTCUTS,
    );
    expect(quickAccessShortcutIds({ shortcuts: 'companies' })).toEqual(
      DEFAULT_QUICK_ACCESS_SHORTCUTS,
    );
  });

  it('drops unknown shortcut ids and keeps catalog order', () => {
    expect(
      quickAccessShortcutIds({
        shortcuts: ['channels', 'gone', 7, 'companies'],
      }),
    ).toEqual(['companies', 'channels']);
  });

  it('keeps an empty choice empty', () => {
    expect(quickAccessShortcutIds({ shortcuts: [] })).toEqual([]);
  });
});

describe('cloneDashboardBoard', () => {
  it('copies deeply, configs included', () => {
    const board = defaultDashboardBoard();
    board.items[0]!.config = { shortcuts: ['companies'] };
    const copy = cloneDashboardBoard(board);
    expect(copy).toEqual(board);
    copy.layout[0]!.x = 5;
    (copy.items[0]!.config!.shortcuts as string[]).push('price-lists');
    expect(board.layout[0]!.x).toBe(0);
    expect(board.items[0]!.config!.shortcuts).toEqual(['companies']);
  });
});

describe('removeDashboardWidget', () => {
  it('drops the widget and its layout entry only', () => {
    const board = defaultDashboardBoard();
    const [first, second] = board.items;
    const next = removeDashboardWidget(board, first!.i);
    expect(next.items).toEqual([second]);
    expect(next.layout.map((l) => l.i)).toEqual([second!.i]);
    expect(board.items).toHaveLength(2);
  });
});

describe('saved boards', () => {
  const stored = (dashboards: unknown, version: unknown = 1) => ({
    version,
    dashboards,
  });

  it('round-trips a board through serialize and parse', () => {
    const board = defaultDashboardBoard();
    board.items[0]!.config = { shortcuts: ['companies'] };
    expect(parseStoredDashboards(serializeDashboards(board))).toEqual(board);
  });

  it('saves plain grid units only', () => {
    const board = defaultDashboardBoard();
    const withGridFlags = {
      ...board,
      layout: board.layout.map((l) => ({ ...l, moved: false, static: false })),
    };
    expect(serializeDashboards(withGridFlags).dashboards[0]!.layout).toEqual(
      board.layout,
    );
  });

  it('gives null for another version or anything that is not a saved board', () => {
    const { dashboards } = serializeDashboards(defaultDashboardBoard());
    expect(parseStoredDashboards(stored(dashboards, 2))).toBeNull();
    expect(parseStoredDashboards(stored([]))).toBeNull();
    expect(parseStoredDashboards(null)).toBeNull();
    expect(parseStoredDashboards('board')).toBeNull();
    expect(parseStoredDashboards({ version: 1 })).toBeNull();
    expect(
      parseStoredDashboards(
        stored([{ id: 'my-work', items: [{ i: 'a' }], layout: [] }]),
      ),
    ).toBeNull();
  });

  it('drops unknown widgets, widgets without a position and duplicates', () => {
    const board = parseStoredDashboards(
      stored([
        {
          id: 'my-work',
          items: [
            { i: 'gone__0', type: 'sales-forecast' },
            { i: 'quick-access__1', type: 'quick-access' },
            { i: 'quick-access__1', type: 'quick-access' },
            { i: 'list-company-orders__2', type: 'list-company-orders' },
          ],
          layout: [
            { i: 'gone__0', x: 0, y: 0, w: 4, h: 4 },
            { i: 'quick-access__1', x: 0, y: 4, w: 4, h: 4 },
          ],
        },
      ]),
    );
    expect(board).toEqual({
      items: [{ i: 'quick-access__1', type: 'quick-access' }],
      layout: [{ i: 'quick-access__1', x: 0, y: 4, w: 4, h: 4 }],
    });
  });

  it('clamps sizes to the widget minimum and the grid', () => {
    const board = parseStoredDashboards(
      stored([
        {
          id: 'my-work',
          items: [
            { i: 'a', type: 'list-company-orders' },
            { i: 'b', type: 'quick-access' },
          ],
          layout: [
            { i: 'a', x: -2, y: -1, w: 1, h: 2 },
            { i: 'b', x: 10, y: 0, w: 40, h: 4 },
          ],
        },
      ]),
    );
    const { minW, minH } = DASHBOARD_WIDGETS['list-company-orders'].size;
    expect(board!.layout).toEqual([
      { i: 'a', x: 0, y: 0, w: minW, h: minH },
      { i: 'b', x: 0, y: 0, w: DASHBOARD_GRID_COLUMNS, h: 4 },
    ]);
  });

  it('keys storage by account and user', () => {
    expect(dashboardStorageKey('acme', 'u1')).toBe('geins-dashboard-acme-u1');
  });
});
