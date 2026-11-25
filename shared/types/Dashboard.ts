/**
 * Start dashboard: a board of widgets on a 12-column grid. These are UI state
 * kept per user in the browser, not API entities.
 */

/** Every widget the dashboard can show. A new widget adds its type here. */
export type DashboardWidgetType = 'quick-access' | 'list-company-orders';

/** Groups in the Add widget panel, in display order. */
export type DashboardWidgetGroup =
  | 'needs_attention'
  | 'charts'
  | 'lists'
  | 'shortcuts';

/**
 * How the widget shell lays out the body: `default` pads it, `flush` pads it
 * less (charts), `table` leaves it unpadded for a full-width table, and `bare`
 * drops the header (a single number tile).
 */
export type DashboardWidgetVariant = 'default' | 'flush' | 'table' | 'bare';

/** A size in grid units: columns (of 12) and rows. */
export interface DashboardWidgetSize {
  w: number;
  h: number;
  minW: number;
  minH: number;
}

export interface DashboardWidgetDefinition {
  type: DashboardWidgetType;
  /** i18n key of the title shown in the widget header and the Add widget panel */
  titleKey: string;
  /** i18n key of the short description under the title */
  descriptionKey: string;
  group: DashboardWidgetGroup;
  /** Lucide icon name, resolved with `useLucideIcon()` */
  icon: string;
  size: DashboardWidgetSize;
  variant: DashboardWidgetVariant;
  /**
   * Height in px when the board stacks one widget per row (phones). `auto`
   * lets the content decide. Omitted: the grid height (rows × row height + gaps).
   */
  stackedHeight?: number | 'auto';
  /** Settings a new instance starts with */
  defaultConfig?: Record<string, unknown>;
}

/** One widget placed on a board. `i` is unique on the board, `{type}__{n}`. */
export interface DashboardWidgetInstance {
  i: string;
  type: DashboardWidgetType;
  /** The instance's own settings, e.g. the shortcuts Quick access shows */
  config?: Record<string, unknown>;
}

/** Where a widget sits on the grid, in grid units. Matches `items[].i`. */
export interface DashboardLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardBoard {
  items: DashboardWidgetInstance[];
  layout: DashboardLayoutItem[];
}
