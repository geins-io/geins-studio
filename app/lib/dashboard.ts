import * as z from 'zod';
import type {
  DashboardBoard,
  DashboardLayoutItem,
  DashboardWidgetDefinition,
  DashboardWidgetGroup,
  DashboardWidgetInstance,
  DashboardWidgetType,
} from '#shared/types';
import { entityListUrl, entityNewUrl } from '#shared/utils/entities';
import type { InjectionKey, Ref } from 'vue';

/** Grid columns, row height (px) and gap (px), as in the prototype */
export const DASHBOARD_GRID_COLUMNS = 12;
export const DASHBOARD_ROW_HEIGHT = 28;
export const DASHBOARD_GRID_GAP = 16;
/** Below this board width (px) the widgets stack, one per row, without editing */
export const DASHBOARD_STACK_BELOW = 640;

export const DASHBOARD_WIDGET_GROUPS: DashboardWidgetGroup[] = [
  'needs_attention',
  'charts',
  'lists',
  'shortcuts',
];

export const DASHBOARD_WIDGETS: Record<
  DashboardWidgetType,
  DashboardWidgetDefinition
> = {
  'quick-access': {
    type: 'quick-access',
    titleKey: 'dashboards.widgets.quick_access.title',
    descriptionKey: 'dashboards.widgets.quick_access.description',
    group: 'shortcuts',
    icon: 'Zap',
    size: { w: 4, h: 4, minW: 3, minH: 4 },
    variant: 'default',
    stackedHeight: 'auto',
  },
  'list-company-orders': {
    type: 'list-company-orders',
    titleKey: 'dashboards.widgets.company_orders.title',
    descriptionKey: 'dashboards.widgets.company_orders.description',
    group: 'lists',
    icon: 'ShoppingBag',
    size: { w: 4, h: 10, minW: 3, minH: 6 },
    variant: 'table',
  },
};

export function isDashboardWidgetType(
  type: unknown,
): type is DashboardWidgetType {
  return typeof type === 'string' && Object.hasOwn(DASHBOARD_WIDGETS, type);
}

/**
 * A board from `[type, x, y, w?, h?]` entries; size defaults to the widget's.
 * Instance ids follow the entry order, `{type}__{index}`.
 */
export function createDashboardBoard(
  entries: [DashboardWidgetType, number, number, number?, number?][],
): DashboardBoard {
  const board: DashboardBoard = { items: [], layout: [] };
  entries.forEach(([type, x, y, w, h], index) => {
    const { size } = DASHBOARD_WIDGETS[type];
    const i = `${type}__${index}`;
    board.items.push({ i, type });
    board.layout.push({ i, x, y, w: w ?? size.w, h: h ?? size.h });
  });
  return board;
}

/**
 * The board a user gets before they change anything. It grows as widgets
 * land; lists keep a third of the width, as in the prototype.
 */
export function defaultDashboardBoard(): DashboardBoard {
  return createDashboardBoard([
    ['quick-access', 0, 0, 12, 4],
    ['list-company-orders', 0, 4],
  ]);
}

/**
 * A deep copy of plain board data. The grid moves layout items in place while
 * dragging, so an edit session keeps a copy to restore on Cancel.
 */
export function cloneDashboardBoard(board: DashboardBoard): DashboardBoard {
  return JSON.parse(JSON.stringify(board));
}

/** The board without widget `i`: its item and its layout entry */
export function removeDashboardWidget(
  board: DashboardBoard,
  i: string,
): DashboardBoard {
  return {
    items: board.items.filter((item) => item.i !== i),
    layout: board.layout.filter((position) => position.i !== i),
  };
}

// ── Adding widgets ───────────────────────────────────────────────────────────

/** The grid's stand-in layout entry while a widget is dragged in from the panel */
export const DASHBOARD_DROP_ID = '__dropping__';

/** The first free row under every widget */
export function dashboardBottom(layout: DashboardLayoutItem[]): number {
  return layout.reduce((bottom, p) => Math.max(bottom, p.y + p.h), 0);
}

/**
 * An instance id not on the board yet, `{type}__{n}`, so the same widget can
 * sit on the board more than once.
 */
export function nextDashboardWidgetId(
  items: DashboardWidgetInstance[],
  type: DashboardWidgetType,
): string {
  const taken = new Set(items.map((item) => item.i));
  let n = items.length;
  while (taken.has(`${type}__${n}`)) n++;
  return `${type}__${n}`;
}

/**
 * The board with a new `type` widget at its default size: at `at`, or on the
 * left under every other widget.
 */
export function addDashboardWidget(
  board: DashboardBoard,
  type: DashboardWidgetType,
  at?: { x: number; y: number },
): DashboardBoard {
  const { size, defaultConfig } = DASHBOARD_WIDGETS[type];
  const i = nextDashboardWidgetId(board.items, type);
  const x = Math.min(Math.max(at?.x ?? 0, 0), DASHBOARD_GRID_COLUMNS - size.w);
  const y = at ? Math.max(at.y, 0) : dashboardBottom(board.layout);
  return {
    items: [
      ...board.items,
      defaultConfig
        ? { i, type, config: JSON.parse(JSON.stringify(defaultConfig)) }
        : { i, type },
    ],
    layout: [...board.layout, { i, x, y, w: size.w, h: size.h }],
  };
}

/**
 * The grid cell for a widget `w` columns wide whose top-left corner is at
 * `left`/`top` px from the grid's top-left, kept on the grid. Same maths as
 * grid-layout-plus uses for its own drags, so the drop lands where it shows.
 */
export function dashboardCellAt(
  left: number,
  top: number,
  gridWidth: number,
  w: number,
): { x: number; y: number } {
  const colWidth =
    (gridWidth - DASHBOARD_GRID_GAP * (DASHBOARD_GRID_COLUMNS + 1)) /
    DASHBOARD_GRID_COLUMNS;
  const x = Math.round(
    (left - DASHBOARD_GRID_GAP) / (colWidth + DASHBOARD_GRID_GAP),
  );
  const y = Math.round(
    (top - DASHBOARD_GRID_GAP) / (DASHBOARD_ROW_HEIGHT + DASHBOARD_GRID_GAP),
  );
  return {
    x: Math.min(Math.max(x, 0), DASHBOARD_GRID_COLUMNS - w),
    y: Math.max(y, 0),
  };
}

// ── Saved boards ─────────────────────────────────────────────────────────────

/**
 * Version of the saved shape. Bump it, and teach `parseStoredDashboards` the
 * old one, when the shape changes; an unknown version falls back to the default.
 */
export const DASHBOARD_STORAGE_VERSION = 1;
/** The one dashboard there is until users can have several */
export const DEFAULT_DASHBOARD_ID = 'my-work';

export function dashboardStorageKey(accountKey: string, userId: string) {
  return `geins-dashboard-${accountKey}-${userId}`;
}

const storedDashboardsSchema = z.object({
  version: z.literal(DASHBOARD_STORAGE_VERSION),
  dashboards: z.array(
    z.object({
      id: z.string(),
      items: z.array(
        z.object({
          i: z.string().min(1),
          type: z.string(),
          config: z.record(z.string(), z.unknown()).optional(),
        }),
      ),
      layout: z.array(
        z.object({
          i: z.string(),
          x: z.number().int(),
          y: z.number().int(),
          w: z.number().int(),
          h: z.number().int(),
        }),
      ),
    }),
  ),
});

export type StoredDashboards = z.infer<typeof storedDashboardsSchema>;

/** The saved form of a board: plain grid units only, no grid-internal flags */
export function serializeDashboards(board: DashboardBoard): StoredDashboards {
  return {
    version: DASHBOARD_STORAGE_VERSION,
    dashboards: [
      {
        id: DEFAULT_DASHBOARD_ID,
        items: board.items.map(({ i, type, config }) =>
          config ? { i, type, config } : { i, type },
        ),
        layout: board.layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
      },
    ],
  };
}

/**
 * The saved board, made safe to render: widgets the registry no longer knows
 * are dropped with their layout entries, a widget needs exactly one layout
 * entry, and sizes are clamped to the widget's minimum and the grid. `null`
 * when there's nothing usable (another version, or not a saved board at all).
 */
export function parseStoredDashboards(raw: unknown): DashboardBoard | null {
  const parsed = storedDashboardsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const stored =
    parsed.data.dashboards.find((d) => d.id === DEFAULT_DASHBOARD_ID) ??
    parsed.data.dashboards[0];
  if (!stored) return null;

  const positions = new Map(stored.layout.map((p) => [p.i, p]));
  const board: DashboardBoard = { items: [], layout: [] };
  const seen = new Set<string>();

  for (const item of stored.items) {
    const position = positions.get(item.i);
    if (!isDashboardWidgetType(item.type) || !position || seen.has(item.i)) {
      continue;
    }
    seen.add(item.i);
    const { size } = DASHBOARD_WIDGETS[item.type];
    const w = Math.min(Math.max(position.w, size.minW), DASHBOARD_GRID_COLUMNS);
    board.items.push(
      item.config
        ? { i: item.i, type: item.type, config: item.config }
        : { i: item.i, type: item.type },
    );
    board.layout.push({
      i: item.i,
      x: Math.min(Math.max(position.x, 0), DASHBOARD_GRID_COLUMNS - w),
      y: Math.max(position.y, 0),
      w,
      h: Math.max(position.h, size.minH),
    });
  }
  return board;
}

/**
 * What a board gives the widgets inside it: whether it's being edited, and
 * how to take a widget off it.
 */
export interface DashboardBoardContext {
  editing: Readonly<Ref<boolean>>;
  remove: (i: string) => void;
}

export const DASHBOARD_BOARD_CONTEXT: InjectionKey<DashboardBoardContext> =
  Symbol('dashboard-board');

/** Layout in reading order (top to bottom, then left to right) for stacking */
export function stackedOrder(
  layout: DashboardLayoutItem[],
): DashboardLayoutItem[] {
  return [...layout].sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Pixel height of `rows` grid rows, gaps between them included */
export function rowsToPixels(rows: number): number {
  return rows * DASHBOARD_ROW_HEIGHT + (rows - 1) * DASHBOARD_GRID_GAP;
}

/**
 * A Quick access shortcut. `id` is saved in the widget's config, so it must
 * stay stable. The label is `t(labelKey, labelParams, labelCount)`.
 */
export interface QuickAccessShortcut {
  id: string;
  icon: string;
  href: string;
  labelKey: string;
  labelParams?: Record<string, string>;
  labelCount?: number;
}

export const QUICK_ACCESS_SHORTCUTS: QuickAccessShortcut[] = [
  {
    id: 'new-company',
    icon: 'Plus',
    href: entityNewUrl('company'),
    labelKey: 'create_entity',
    labelParams: { entityKey: 'company' },
  },
  {
    id: 'companies',
    icon: 'Building2',
    href: entityListUrl('company'),
    labelKey: 'company',
    labelCount: 2,
  },
  {
    id: 'new-price-list',
    icon: 'Plus',
    href: entityNewUrl('price_list'),
    labelKey: 'create_entity',
    labelParams: { entityKey: 'price_list' },
  },
  {
    id: 'price-lists',
    icon: 'Tag',
    href: entityListUrl('price_list'),
    labelKey: 'price_list',
    labelCount: 2,
  },
];

/** The four shortcuts on the start page before the dashboard */
export const DEFAULT_QUICK_ACCESS_SHORTCUTS = [
  'new-company',
  'companies',
  'new-price-list',
  'price-lists',
];

/** Minimum width (px) of one Quick access column */
export const QUICK_ACCESS_COLUMN_WIDTH = 190;

export function quickAccessColumns(width: number, count: number): number {
  return Math.max(
    1,
    Math.min(count || 1, Math.floor(width / QUICK_ACCESS_COLUMN_WIDTH) || 1),
  );
}

export type DashboardGreetingPeriod = 'morning' | 'afternoon' | 'evening';

export function greetingPeriod(date: Date): DashboardGreetingPeriod {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
