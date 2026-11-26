import type {
  DashboardWidgetType,
  ExecutionLog,
  Quotation,
} from '#shared/types';
import { calendarDay, localDay } from '#shared/utils/calendar-day';
import { entityListUrl } from '#shared/utils/entities';

/**
 * What the dashboard's quotation and workflow run widgets show, worked out
 * from the lists Studio already fetches. Pure, so the widgets and their tests
 * share one definition of "expiring" or "failed".
 */

/** A pending quotation counts as expiring this many calendar days ahead */
export const EXPIRING_WITHIN_DAYS = 7;
/** Failed workflow runs count this far back (ms) */
export const FAILED_RUNS_WITHIN_MS = 24 * 60 * 60 * 1000;

/** A link into a list page, opened with its filters */
export interface DashboardListLink {
  path: string;
  query: Record<string, string>;
}

// Filters in the query names the quotations and workflow runs lists take. A list
// that doesn't read one yet opens unfiltered.
export const QUOTATION_REQUESTS_LINK: DashboardListLink = {
  path: entityListUrl('quotation'),
  query: { status: 'requested' },
};
export const EXPIRING_QUOTATIONS_LINK: DashboardListLink = {
  path: entityListUrl('quotation'),
  query: { status: 'pending', expiring: `${EXPIRING_WITHIN_DAYS}d` },
};
export const FAILED_RUNS_LINK: DashboardListLink = {
  path: entityListUrl('execution'),
  query: { status: 'failed', period: '24h' },
};

// ── Needs attention ──────────────────────────────────────────────────────────

export type DashboardAttentionKey = 'requests' | 'expiring' | 'failed_runs';
/** A status tone from the colour scheme; the card tints its icon with it */
export type DashboardAttentionTone = 'info' | 'warning' | 'danger';

/**
 * One Needs attention number. Its texts are `dashboards.attention.{key}.label`
 * / `.text` / `.link`.
 */
export interface DashboardAttentionDefinition {
  key: DashboardAttentionKey;
  icon: string;
  tone: DashboardAttentionTone;
  to: DashboardListLink;
  /** Which fetch the number comes from */
  source: 'quotations' | 'executions';
}

export const DASHBOARD_ATTENTION: Record<
  DashboardAttentionKey,
  DashboardAttentionDefinition
> = {
  requests: {
    key: 'requests',
    icon: 'Inbox',
    tone: 'info',
    to: QUOTATION_REQUESTS_LINK,
    source: 'quotations',
  },
  expiring: {
    key: 'expiring',
    icon: 'Clock',
    tone: 'warning',
    to: EXPIRING_QUOTATIONS_LINK,
    source: 'quotations',
  },
  failed_runs: {
    key: 'failed_runs',
    icon: 'Workflow',
    tone: 'danger',
    to: FAILED_RUNS_LINK,
    source: 'executions',
  },
};

/** A number as a widget shows it: its definition, count and fetch state */
export interface DashboardAttentionEntry extends DashboardAttentionDefinition {
  count: number;
  loading: boolean;
  error: boolean;
  retry: () => Promise<void>;
}

/** The numbers in the order Needs attention shows them */
export const DASHBOARD_ATTENTION_KEYS: DashboardAttentionKey[] = [
  'requests',
  'expiring',
  'failed_runs',
];

/** The single-number widgets and the number each shows */
const DASHBOARD_ATTENTION_TILES: Partial<
  Record<DashboardWidgetType, DashboardAttentionKey>
> = {
  'attention-quotation-requests': 'requests',
  'attention-expiring-quotations': 'expiring',
  'attention-failed-runs': 'failed_runs',
};

export function attentionTileKey(
  type: DashboardWidgetType,
): DashboardAttentionKey | undefined {
  return DASHBOARD_ATTENTION_TILES[type];
}

// ── Quotations ───────────────────────────────────────────────────────────────

const time = (value?: string | null) => {
  const ms = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(ms) ? 0 : ms;
};

type RequestFields = Pick<Quotation, 'status' | 'createdAt' | 'request'>;

/** When the buyer's request reached the seller */
export function requestedAt(quotation: RequestFields): string | undefined {
  return quotation.request?.releasedAt ?? quotation.createdAt;
}

/** Buyers' requests waiting for an answer, newest first */
export function quotationRequests<T extends RequestFields>(
  quotations: T[],
): T[] {
  return quotations
    .filter((q) => q.status === 'requested')
    .sort((a, b) => time(requestedAt(b)) - time(requestedAt(a)));
}

/**
 * Calendar days from `now`'s local day to the day `value` names: 0 today,
 * 1 tomorrow, negative once it's passed. `undefined` for no or a bad date.
 */
export function calendarDaysUntil(
  value: string | null | undefined,
  now: Date,
): number | undefined {
  const day = value ? calendarDay(value) : undefined;
  const today = localDay(now.toISOString());
  if (!day || !today) return undefined;
  return Math.round((Date.parse(day) - Date.parse(today)) / 86_400_000);
}

type ExpiryFields = Pick<Quotation, 'status' | 'validTo'>;

/**
 * Sent quotations the buyer hasn't answered that expire today or within
 * `withinDays` calendar days, soonest first. One whose day has passed but
 * that the API still shows as pending is left out: it can't be accepted.
 */
export function expiringQuotations<T extends ExpiryFields>(
  quotations: T[],
  now: Date,
  withinDays = EXPIRING_WITHIN_DAYS,
): T[] {
  return quotations
    .filter((q) => {
      if (q.status !== 'pending') return false;
      const days = calendarDaysUntil(q.validTo, now);
      return days !== undefined && days >= 0 && days <= withinDays;
    })
    .sort((a, b) => time(a.validTo) - time(b.validTo));
}

// ── Workflow runs ────────────────────────────────────────────────────────────

/**
 * Workflow runs that failed and started within `withinMs` before `now`,
 * newest first. The API is asked for failed runs only; this keeps the count
 * right if it ignores the filter.
 */
export function failedExecutions<
  T extends Pick<ExecutionLog, 'status' | 'startTime'>,
>(executions: T[], now: Date, withinMs = FAILED_RUNS_WITHIN_MS): T[] {
  const since = now.getTime() - withinMs;
  return executions
    .filter(
      (e) => e.status?.toLowerCase() === 'failed' && time(e.startTime) >= since,
    )
    .sort((a, b) => time(b.startTime) - time(a.startTime));
}
