// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type {
  DashboardBoard,
  DashboardLayoutItem,
  DashboardWidgetType,
} from '#shared/types';
import {
  DASHBOARD_GRID_COLUMNS,
  DASHBOARD_GRID_GAP,
  DASHBOARD_ROW_HEIGHT,
  DASHBOARD_TEMPLATES,
  DASHBOARD_WIDGETS,
  DEFAULT_QUICK_ACCESS_SHORTCUTS,
  QUICK_ACCESS_SHORTCUTS,
  addDashboardWidget,
  cloneDashboardBoard,
  compactDashboardLayout,
  createDashboardBoard,
  dashboardBottom,
  dashboardCellAt,
  dashboardStorageKey,
  dashboardWidgetMode,
  defaultDashboardBoard,
  findUserByRef,
  greetingPeriod,
  isDashboardWidgetType,
  nextDashboardWidgetId,
  packDashboardBoard,
  parseStoredDashboards,
  pixelsToRows,
  quickAccessColumns,
  quickAccessShortcutIds,
  removeDashboardWidget,
  rowsToPixels,
  sameDashboardBoard,
  serializeDashboards,
  stackedOrder,
} from '../dashboard';

const quickAccessOf = (board: DashboardBoard) =>
  board.items.find((item) => item.type === 'quick-access')!;

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

  it('leaves no gaps: every column is filled from the top to one bottom', () => {
    const bottom = dashboardBottom(board.layout);
    for (let column = 0; column < DASHBOARD_GRID_COLUMNS; column++) {
      const inColumn = stackedOrder(board.layout).filter(
        (p) => p.x <= column && column < p.x + p.w,
      );
      let y = 0;
      for (const position of inColumn) {
        expect(position.y).toBe(y);
        y += position.h;
      }
      expect(y).toBe(bottom);
    }
  });

  // A fitted height that differs from the default would otherwise leave a
  // gap under the widget, or push one column further down than its neighbours
  it('gives widgets that fit their content the full width', () => {
    for (const position of board.layout) {
      const item = board.items.find((it) => it.i === position.i)!;
      if (!DASHBOARD_WIDGETS[item.type].fit) continue;
      expect(position).toMatchObject({ x: 0, w: DASHBOARD_GRID_COLUMNS });
    }
  });

  it('stacks Needs attention, Quick access, the queues, then the lists', () => {
    const types = stackedOrder(board.layout).map(
      (position) => board.items.find((it) => it.i === position.i)!.type,
    );
    expect(types).toEqual([
      'needs-attention',
      'quick-access',
      'queue-quotation-requests',
      'queue-expiring-quotations',
      'queue-failed-runs',
      'list-company-orders',
      'list-recent-quotations',
      'list-recent-assets',
    ]);
  });

  it('returns a fresh board each call', () => {
    expect(defaultDashboardBoard()).not.toBe(board);
    expect(defaultDashboardBoard().layout[0]).not.toBe(board.layout[0]);
  });
});

describe('packDashboardBoard', () => {
  const positionsOf = (board: DashboardBoard) =>
    board.layout.map(({ x, y, w, h }) => [x, y, w, h]);

  it('places widgets left to right at their default sizes, wrapping when the next doesn’t fit', () => {
    const board = packDashboardBoard([
      'queue-quotation-requests',
      'queue-expiring-quotations',
      'queue-failed-runs',
      'list-recent-assets',
    ]);
    expect(positionsOf(board)).toEqual([
      [0, 0, 4, 8],
      [4, 0, 4, 8],
      [8, 0, 4, 8],
      [0, 8, 4, 10],
    ]);
  });

  it('wraps under the tallest widget in the row, then compacts as the grid does', () => {
    const board = packDashboardBoard([
      'needs-attention',
      'queue-quotation-requests',
      'list-recent-quotations',
      'queue-failed-runs',
      'list-recent-assets',
    ]);
    // The row under Needs attention is 10 tall; the next widget moves up
    // under the 8-tall queue above it
    expect(positionsOf(board)).toEqual([
      [0, 0, 12, 5],
      [0, 5, 4, 8],
      [4, 5, 4, 10],
      [8, 5, 4, 8],
      [0, 13, 4, 10],
    ]);
  });

  it('gives the same widget twice its own id', () => {
    const board = packDashboardBoard(['quick-access', 'quick-access']);
    expect(board.items).toEqual([
      { i: 'quick-access__0', type: 'quick-access' },
      { i: 'quick-access__1', type: 'quick-access' },
    ]);
    expect(board.layout.map((position) => position.i)).toEqual([
      'quick-access__0',
      'quick-access__1',
    ]);
  });

  it('keeps every board inside the grid, without overlaps or shared ids', () => {
    const types = Object.keys(DASHBOARD_WIDGETS) as DashboardWidgetType[];
    const boards = [
      packDashboardBoard(types),
      packDashboardBoard([...types].reverse()),
      ...DASHBOARD_TEMPLATES.map((template) =>
        packDashboardBoard(template.types),
      ),
    ];
    for (const { items, layout } of boards) {
      const ids = items.map((item) => item.i);
      expect(new Set(ids).size).toBe(ids.length);
      expect(layout.map((position) => position.i)).toEqual(ids);
      for (const position of layout) {
        expect(position.x).toBeGreaterThanOrEqual(0);
        expect(position.x + position.w).toBeLessThanOrEqual(
          DASHBOARD_GRID_COLUMNS,
        );
      }
      for (let a = 0; a < layout.length; a++) {
        for (let b = a + 1; b < layout.length; b++) {
          expect(overlaps(layout[a]!, layout[b]!)).toBe(false);
        }
      }
    }
  });

  it('is empty without widgets', () => {
    expect(packDashboardBoard([])).toEqual({ items: [], layout: [] });
  });
});

describe('DASHBOARD_TEMPLATES', () => {
  it('has unique ids and only widgets the registry knows', () => {
    const ids = DASHBOARD_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const template of DASHBOARD_TEMPLATES) {
      expect(template.types.length).toBeGreaterThan(0);
      expect(template.types.every(isDashboardWidgetType)).toBe(true);
    }
  });

  it('puts the administration widgets side by side, as in the prototype', () => {
    const admin = DASHBOARD_TEMPLATES.find((t) => t.id === 'admin')!;
    const board = packDashboardBoard(admin.types);
    expect(board.layout.map(({ i, x, y }) => [i.split('__')[0], x, y])).toEqual(
      [
        ['quick-access', 0, 0],
        ['queue-failed-runs', 4, 0],
        ['list-recent-assets', 8, 0],
      ],
    );
  });

  it('starts the quotations and orders template with Needs attention across the top', () => {
    const sales = DASHBOARD_TEMPLATES.find((t) => t.id === 'sales')!;
    const [first] = packDashboardBoard(sales.types).layout;
    expect(first).toMatchObject({
      i: 'needs-attention__0',
      x: 0,
      y: 0,
      w: DASHBOARD_GRID_COLUMNS,
    });
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
    const quickAccess = quickAccessOf(board);
    quickAccess.config = { shortcuts: ['companies'] };
    const copy = cloneDashboardBoard(board);
    expect(copy).toEqual(board);
    copy.layout[0]!.x = 5;
    (quickAccessOf(copy).config!.shortcuts as string[]).push('price-lists');
    expect(board.layout[0]!.x).toBe(0);
    expect(quickAccess.config!.shortcuts).toEqual(['companies']);
  });
});

describe('compactDashboardLayout', () => {
  const at = (i: string, x: number, y: number, w: number, h: number) => ({
    i,
    x,
    y,
    w,
    h,
  });

  it('leaves the default board as it is', () => {
    const { layout } = defaultDashboardBoard();
    expect(compactDashboardLayout(layout)).toEqual(layout);
  });

  it('moves widgets up into gaps, keeping the array order', () => {
    const layout = [
      at('b', 0, 9, 6, 2),
      at('a', 0, 3, 6, 2),
      at('c', 6, 5, 6, 3),
    ];
    expect(compactDashboardLayout(layout)).toEqual([
      at('b', 0, 2, 6, 2),
      at('a', 0, 0, 6, 2),
      at('c', 6, 0, 6, 3),
    ]);
    expect(layout[0]!.y).toBe(9);
  });

  it('pushes a widget below the taller one it overlaps', () => {
    const layout = [at('top', 0, 0, 12, 5), at('left', 0, 4, 4, 2)];
    expect(compactDashboardLayout(layout)[1]).toEqual(at('left', 0, 5, 4, 2));
  });
});

describe('sameDashboardBoard', () => {
  it('sees the same board through compaction', () => {
    const board = defaultDashboardBoard();
    const moved = cloneDashboardBoard(board);
    for (const position of moved.layout) position.y += 2;
    expect(sameDashboardBoard(board, moved)).toBe(true);
  });

  it('tells a moved widget, another size or other settings apart', () => {
    const board = defaultDashboardBoard();

    const swapped = cloneDashboardBoard(board);
    swapped.layout[0]!.y = 40;
    expect(sameDashboardBoard(board, swapped)).toBe(false);

    const resized = cloneDashboardBoard(board);
    resized.layout.at(-1)!.w -= 1;
    expect(sameDashboardBoard(board, resized)).toBe(false);

    const configured = cloneDashboardBoard(board);
    quickAccessOf(configured).config = { shortcuts: ['companies'] };
    expect(sameDashboardBoard(board, configured)).toBe(false);
  });
});

describe('removeDashboardWidget', () => {
  it('drops the widget and its layout entry only', () => {
    const board = defaultDashboardBoard();
    const [first, ...rest] = board.items;
    const next = removeDashboardWidget(board, first!.i);
    expect(next.items).toEqual(rest);
    expect(next.layout.map((l) => l.i)).toEqual(rest.map((item) => item.i));
    expect(board.items).toHaveLength(rest.length + 1);
  });
});

describe('addDashboardWidget', () => {
  it('adds at the bottom on the left, at the default size', () => {
    const board = defaultDashboardBoard();
    const bottom = dashboardBottom(board.layout);
    const next = addDashboardWidget(board, 'quick-access');
    const added = next.layout.at(-1)!;
    const { size } = DASHBOARD_WIDGETS['quick-access'];

    expect(next.items.at(-1)!.type).toBe('quick-access');
    expect(added).toMatchObject({ x: 0, y: bottom, w: size.w, h: size.h });
    for (const position of board.layout) {
      expect(added.y).toBeGreaterThanOrEqual(position.y + position.h);
    }
    expect(board.items).toHaveLength(defaultDashboardBoard().items.length);
  });

  it('adds at the top of an empty board', () => {
    const next = addDashboardWidget({ items: [], layout: [] }, 'quick-access');
    expect(next.layout[0]).toMatchObject({ x: 0, y: 0 });
  });

  it('gives the same widget a new id each time', () => {
    let board = defaultDashboardBoard();
    board = addDashboardWidget(board, 'list-company-orders');
    board = addDashboardWidget(board, 'list-company-orders');
    const ids = board.items.map((item) => item.i);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice(-2)).toEqual([
      expect.stringMatching(/^list-company-orders__\d+$/),
      expect.stringMatching(/^list-company-orders__\d+$/),
    ]);
    expect(board.layout.map((l) => l.i)).toEqual(ids);
  });

  it('places it at a cell, kept on the grid', () => {
    const board = defaultDashboardBoard();
    const { w } = DASHBOARD_WIDGETS['list-company-orders'].size;

    expect(
      addDashboardWidget(board, 'list-company-orders', {
        x: 4,
        y: 2,
      }).layout.at(-1),
    ).toMatchObject({ x: 4, y: 2 });
    expect(
      addDashboardWidget(board, 'list-company-orders', {
        x: 11,
        y: -1,
      }).layout.at(-1),
    ).toMatchObject({ x: DASHBOARD_GRID_COLUMNS - w, y: 0 });
  });
});

describe('nextDashboardWidgetId', () => {
  it('skips ids already on the board', () => {
    const { items } = createDashboardBoard([
      ['quick-access', 0, 0],
      ['quick-access', 0, 4],
    ]);
    // quick-access__0 and quick-access__1, minus the first
    expect(nextDashboardWidgetId(items.slice(1), 'quick-access')).toBe(
      'quick-access__2',
    );
  });
});

describe('dashboardCellAt', () => {
  // 84px columns, so a column and its gap are 100px
  const width = DASHBOARD_GRID_GAP * (DASHBOARD_GRID_COLUMNS + 1) + 84 * 12;
  const rowPitch = DASHBOARD_ROW_HEIGHT + DASHBOARD_GRID_GAP;

  it('maps a point to the cell whose corner is nearest', () => {
    expect(dashboardCellAt(16 + 6 * 100, 16 + 3 * rowPitch, width, 4)).toEqual({
      x: 6,
      y: 3,
    });
    expect(dashboardCellAt(16 + 2 * 100 + 40, 16, width, 4)).toEqual({
      x: 2,
      y: 0,
    });
  });

  it('keeps the widget on the grid', () => {
    expect(dashboardCellAt(-50, -50, width, 4)).toEqual({ x: 0, y: 0 });
    expect(dashboardCellAt(width, 16, width, 4)).toEqual({
      x: DASHBOARD_GRID_COLUMNS - 4,
      y: 0,
    });
  });
});

describe('saved boards', () => {
  const stored = (dashboards: unknown, version: unknown = 1) => ({
    version,
    dashboards,
  });

  it('round-trips a board through serialize and parse', () => {
    const board = defaultDashboardBoard();
    quickAccessOf(board).config = { shortcuts: ['companies'] };
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

describe('findUserByRef', () => {
  const users = [
    { _id: 'u1', email: 'Maja@Example.com' },
    { _id: 'u2', email: null },
  ];

  it('matches a user id or an email, ignoring case and spaces', () => {
    expect(findUserByRef('u2', users)?._id).toBe('u2');
    expect(findUserByRef(' maja@example.COM ', users)?._id).toBe('u1');
  });

  it('finds no one for an unknown or empty reference', () => {
    expect(findUserByRef('someone@example.com', users)).toBeUndefined();
    expect(findUserByRef('', users)).toBeUndefined();
    expect(findUserByRef(null, users)).toBeUndefined();
  });
});

describe('dashboardWidgetMode', () => {
  const sales = (config?: Record<string, unknown>) => ({
    i: 'chart-company-orders__0',
    type: 'chart-company-orders' as const,
    config,
  });

  it('is the first enabled mode without a saved one', () => {
    expect(dashboardWidgetMode(sales())).toBe('demand');
  });

  it('ignores a saved mode that is disabled or unknown', () => {
    expect(dashboardWidgetMode(sales({ mode: 'revenue' }))).toBe('demand');
    expect(dashboardWidgetMode(sales({ mode: 'margin' }))).toBe('demand');
  });

  it('is undefined for a widget without modes', () => {
    expect(
      dashboardWidgetMode({ i: 'quick-access__0', type: 'quick-access' }),
    ).toBeUndefined();
  });
});
