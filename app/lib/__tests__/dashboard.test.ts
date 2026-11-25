// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { DashboardLayoutItem } from '#shared/types';
import {
  DASHBOARD_GRID_COLUMNS,
  DASHBOARD_WIDGETS,
  DEFAULT_QUICK_ACCESS_SHORTCUTS,
  QUICK_ACCESS_SHORTCUTS,
  defaultDashboardBoard,
  greetingPeriod,
  isDashboardWidgetType,
  quickAccessColumns,
  rowsToPixels,
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
});
