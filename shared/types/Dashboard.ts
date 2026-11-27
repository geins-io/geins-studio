import type { StatusBadgeStatus } from './Global';
import type { Component } from 'vue';

/**
 * Start dashboard: a board of widgets on a 12-column grid. These are UI state
 * kept per user in the browser, not API entities.
 */

/** Every widget the dashboard can show. A new widget adds its type here. */
export type DashboardWidgetType =
  | 'quick-access'
  | 'list-company-orders'
  | 'chart-company-orders'
  | 'needs-attention'
  | 'attention-quotation-requests'
  | 'attention-expiring-quotations'
  | 'attention-failed-runs'
  | 'queue-quotation-requests'
  | 'queue-expiring-quotations'
  | 'queue-failed-runs'
  | 'list-recent-quotations'
  | 'list-recent-assets';

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

/**
 * A view of a widget picked in its header (e.g. Demand / Revenue). The pick is
 * saved in the instance's `config.mode`; the first enabled mode is the default.
 */
export interface DashboardWidgetMode {
  key: string;
  /** i18n key of the toggle label */
  labelKey: string;
  /** i18n key of the header description while this mode is on */
  descriptionKey: string;
  /** Shown but not selectable; the i18n key of the tooltip saying why */
  disabledReasonKey?: string;
}

/**
 * An explanation behind an info button in the widget header, opened in a
 * narrow panel. The widget gives the panel's content in its `info` slot.
 */
export interface DashboardWidgetInfo {
  /** i18n key of the panel title, also the button's tooltip */
  titleKey: string;
  /** i18n key of the panel description */
  descriptionKey: string;
}

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
  /**
   * The height follows the content: the widget frame measures it and sets the
   * grid height to the rows it needs, so the user resizes only the width.
   */
  fit?: boolean;
  /** Settings a new instance starts with */
  defaultConfig?: Record<string, unknown>;
  /** Views picked in the header, e.g. Demand / Revenue */
  modes?: DashboardWidgetMode[];
  /** An info button in the header, e.g. what Demand and Revenue count */
  info?: DashboardWidgetInfo;
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

/**
 * One row in a dashboard queue: a quotation or workflow run, with the link to
 * it. `avatar` is a company name, shown as its initials.
 */
export interface DashboardQueueItem {
  id: string;
  to: string;
  title: string;
  meta: string;
  /** Right of the title: an age, or when it expires */
  aside?: string;
  avatar?: string;
  status?: StatusBadgeStatus;
  /** Translated status text; see `StatusBadge` */
  statusLabel?: string;
}

/** A quick choice in the dashboard's period bar */
export type DashboardPeriodPreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_7_days'
  | 'this_month'
  | 'last_30_days'
  | 'ytd';

/**
 * The period every widget reads: a preset or `custom`, as local dates. `from`
 * is the start of its first day, `to` the end of its last (inclusive).
 */
export interface DashboardPeriod {
  preset: DashboardPeriodPreset | 'custom';
  from: Date;
  to: Date;
}

/** The Channel and Market filter buttons, as list filters. Empty: all. */
export interface DashboardScopeFilters {
  channels?: string[];
  markets?: string[];
}

/** One choice in a dashboard segmented toggle (`DashboardToggle`) */
export interface DashboardToggleOption {
  value: string;
  /** Button text, or the tooltip and accessible name of an icon button */
  label: string;
  /** Shows the icon instead of the label */
  icon?: Component;
  /** Shown but not selectable; the tooltip says why */
  disabledReason?: string;
}

/** One step on a dashboard chart's x axis: tick label, tooltip title, a value per series */
export interface DashboardChartPoint {
  label: string;
  title: string;
  values: Record<string, number>;
}

/** One line on a dashboard chart, or one part of its stacked bars */
export interface DashboardChartSeries {
  key: string;
  label: string;
  /** A CSS colour from the theme's tokens (`var(--tone-…)`), never a raw hex */
  color: string;
}
