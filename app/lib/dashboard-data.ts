import type {
  DashboardWidgetType,
  ExecutionLog,
  Quotation,
  QuotationStatus,
} from '#shared/types';
import { calendarDay, localDay } from '#shared/utils/calendar-day';
import { entityListUrl } from '#shared/utils/entities';

/**
 * What the dashboard's quotation and workflow run widgets show, worked out
 * from the lists Studio already fetches. Pure, so the widgets and their tests
 * share one definition of "expiring" or "failed".
 */

/** How many rows a dashboard list shows */
export const DASHBOARD_LIST_LIMIT = 10;
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

type RecentFields = Pick<Quotation, 'createdAt' | 'modifiedAt'>;

/** When the quotation last changed */
export function changedAt(quotation: RecentFields): string | undefined {
  return quotation.modifiedAt ?? quotation.createdAt;
}

/** The most recently changed quotations, newest first */
export function recentQuotations<T extends RecentFields>(
  quotations: T[],
  limit = DASHBOARD_LIST_LIMIT,
): T[] {
  return [...quotations]
    .sort((a, b) => time(changedAt(b)) - time(changedAt(a)))
    .slice(0, limit);
}

// ── Quotations by status ─────────────────────────────────────────────────────

export type QuotationStatusSliceKey =
  | 'requested'
  | 'pending'
  | 'accepted'
  | 'expired'
  | 'rejected'
  | 'canceled';

/**
 * One slice of Quotations by status: the quotation statuses it counts and the
 * tone their badges have. `faded` tells it apart from the slice before it in
 * the same tone; an `optional` slice shows only when it has quotations.
 */
export interface QuotationStatusSliceDefinition {
  key: QuotationStatusSliceKey;
  statuses: QuotationStatus[];
  tone: 'info' | 'success' | 'warning' | 'danger';
  faded?: boolean;
  optional?: boolean;
}

/**
 * The slice each quotation status counts in; `null` for one that isn't sent
 * yet or isn't counted. A `Record` so a new status fails typecheck until it
 * gets a place here.
 */
const SLICE_BY_STATUS: Record<QuotationStatus, QuotationStatusSliceKey | null> =
  {
    requestDraft: null,
    draft: null,
    revised: null,
    requested: 'requested',
    pending: 'pending',
    accepted: 'accepted',
    confirmed: 'accepted',
    finalized: 'accepted',
    expired: 'expired',
    rejected: 'rejected',
    canceled: 'canceled',
  };

const statusesIn = (key: QuotationStatusSliceKey) =>
  (Object.keys(SLICE_BY_STATUS) as QuotationStatus[]).filter(
    (status) => SLICE_BY_STATUS[status] === key,
  );

/** The slices in the order the ring and its legend show them */
export const QUOTATION_STATUS_SLICES: QuotationStatusSliceDefinition[] = (
  [
    { key: 'requested', tone: 'info' },
    { key: 'pending', tone: 'info', faded: true },
    { key: 'accepted', tone: 'success' },
    { key: 'expired', tone: 'warning' },
    { key: 'rejected', tone: 'danger' },
    { key: 'canceled', tone: 'danger', faded: true, optional: true },
  ] satisfies Omit<QuotationStatusSliceDefinition, 'statuses'>[]
).map((slice) => ({ ...slice, statuses: statusesIn(slice.key) }));

export interface QuotationStatusSlice extends QuotationStatusSliceDefinition {
  count: number;
  /** Share of all counted quotations, 0–1 */
  share: number;
}

export interface QuotationStatusSummary {
  slices: QuotationStatusSlice[];
  /** Every sent quotation: the whole ring */
  total: number;
  /** Accepted ÷ (accepted + rejected), 0–1; `null` with nothing answered */
  winRate: number | null;
  /** Expired ÷ every sent quotation, 0–1; `null` with none */
  expiredRate: number | null;
}

const ratio = (part: number, whole: number) => (whole ? part / whole : null);

/**
 * The current status of every sent quotation, by slice, and the rates worked
 * out from it. Drafts and request drafts aren't sent yet, so they're left out,
 * as is any status no slice counts (a revised version).
 */
export function quotationStatusSummary(
  quotations: Pick<Quotation, 'status'>[],
): QuotationStatusSummary {
  const counts = new Map<QuotationStatusSliceKey, number>();
  for (const { status } of quotations) {
    // The API can send a status the type doesn't know yet
    const key = Object.hasOwn(SLICE_BY_STATUS, status)
      ? SLICE_BY_STATUS[status]
      : null;
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const count = (key: QuotationStatusSliceKey) => counts.get(key) ?? 0;
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);

  return {
    slices: QUOTATION_STATUS_SLICES.filter(
      (slice) => !slice.optional || count(slice.key) > 0,
    ).map((slice) => ({
      ...slice,
      count: count(slice.key),
      share: ratio(count(slice.key), total) ?? 0,
    })),
    total,
    winRate: ratio(count('accepted'), count('accepted') + count('rejected')),
    expiredRate: ratio(count('expired'), total),
  };
}

/** A company's initials for its avatar: the first letter of its first two words */
export function companyInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return initials || '?';
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
