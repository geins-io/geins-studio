import type { ExecutionStatus, QuotationStatus } from '#shared/types';
import { entityListUrl } from '#shared/utils/entities';
import { listParam } from '#shared/utils/list-query';

// Filters a list reads from its URL, so a link (e.g. from the dashboard) can
// open it already filtered. Names here are a contract with those links:
// build them with `quotationListLink` / `executionListLink`.

type UrlQuery = Readonly<Record<string, unknown>>;

/** Rolling windows a link can name: back from now (`period`) or ahead (`expiring`). */
export const LIST_URL_PERIOD_MS = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
} as const satisfies Record<string, number>;

export type ListUrlPeriod = keyof typeof LIST_URL_PERIOD_MS;

const isListUrlPeriod = (value: string): value is ListUrlPeriod =>
  Object.hasOwn(LIST_URL_PERIOD_MS, value);

/** One query value as text; a repeated key (`?a=x&a=y`) joins with commas. */
export function queryText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === 'string').join(',');
  }
  return '';
}

/** A known period, or `null` for anything else. */
export function parseListUrlPeriod(value: unknown): ListUrlPeriod | null {
  const raw = queryText(value).trim();
  return isListUrlPeriod(raw) ? raw : null;
}

/** `validTo` lies between `now` and the end of the window, both inclusive. */
export function expiresWithin(
  validTo: string | null | undefined,
  period: ListUrlPeriod,
  now: number,
): boolean {
  if (!validTo) return false;
  const at = Date.parse(validTo);
  if (Number.isNaN(at)) return false;
  return at >= now && at <= now + LIST_URL_PERIOD_MS[period];
}

function listLink(path: string, query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  // Commas are valid in a query value; keep `?status=a,b` readable.
  const search = params.toString().replaceAll('%2C', ',');
  return search ? `${path}?${search}` : path;
}

// ─── Quotations ────────────────────────────────────────────────────

export const QUOTATION_LIST_QUERY_KEYS = {
  status: 'status',
  expiring: 'expiring',
} as const;

// A `Record` so a new status fails typecheck until it's listed here.
const QUOTATION_STATUS_SET: Record<QuotationStatus, true> = {
  requestDraft: true,
  requested: true,
  draft: true,
  pending: true,
  expired: true,
  rejected: true,
  accepted: true,
  confirmed: true,
  finalized: true,
  canceled: true,
  revised: true,
};

const isQuotationStatus = (value: string): value is QuotationStatus =>
  Object.hasOwn(QUOTATION_STATUS_SET, value);

export const QUOTATION_STATUSES: readonly QuotationStatus[] =
  Object.keys(QUOTATION_STATUS_SET).filter(isQuotationStatus);

export interface QuotationListUrlFilters {
  /** Empty = every status. */
  statuses: QuotationStatus[];
  /** Only quotations whose `validTo` falls within this window from now. */
  expiring: ListUrlPeriod | null;
}

const quotationStatusParam = listParam(QUOTATION_STATUSES);

/** `?status=a,b&expiring=7d`; unknown values are dropped. */
export function parseQuotationListQuery(
  query: UrlQuery,
): QuotationListUrlFilters {
  return {
    statuses:
      quotationStatusParam.parse(
        queryText(query[QUOTATION_LIST_QUERY_KEYS.status]),
      ) ?? [],
    expiring: parseListUrlPeriod(query[QUOTATION_LIST_QUERY_KEYS.expiring]),
  };
}

export function matchesQuotationListFilters(
  quotation: { status: QuotationStatus; validTo?: string | null },
  filters: QuotationListUrlFilters,
  now: number,
): boolean {
  if (filters.statuses.length && !filters.statuses.includes(quotation.status)) {
    return false;
  }
  return (
    !filters.expiring || expiresWithin(quotation.validTo, filters.expiring, now)
  );
}

/** `/orders/quotations?status=pending&expiring=7d` */
export function quotationListLink(
  filters: Partial<QuotationListUrlFilters> = {},
): string {
  return listLink(entityListUrl('quotation'), {
    [QUOTATION_LIST_QUERY_KEYS.status]: filters.statuses?.join(','),
    [QUOTATION_LIST_QUERY_KEYS.expiring]: filters.expiring ?? undefined,
  });
}

// ─── Workflow runs (executions) ────────────────────────────────────

export const EXECUTION_LIST_QUERY_KEYS = {
  status: 'status',
  period: 'period',
} as const;

/** Execution statuses as the list compares them: lowercase. */
export type ExecutionStatusFilter = Lowercase<ExecutionStatus>;

const EXECUTION_STATUS_SET: Record<ExecutionStatusFilter, true> = {
  running: true,
  completed: true,
  failed: true,
  canceled: true,
  timedout: true,
  suspended: true,
  pending: true,
  continuedasnew: true,
  terminated: true,
};

const isExecutionStatusFilter = (
  value: string,
): value is ExecutionStatusFilter => Object.hasOwn(EXECUTION_STATUS_SET, value);

export const EXECUTION_STATUS_FILTERS: readonly ExecutionStatusFilter[] =
  Object.keys(EXECUTION_STATUS_SET).filter(isExecutionStatusFilter);

export interface ExecutionListUrlFilters {
  /** Empty = every status. */
  statuses: ExecutionStatusFilter[];
  /** Runs started within this window back from now. */
  period: ListUrlPeriod | null;
}

const executionStatusParam = listParam(EXECUTION_STATUS_FILTERS);

/** `?status=failed&period=24h`; status is case-insensitive, unknown values are dropped. */
export function parseExecutionListQuery(
  query: UrlQuery,
): ExecutionListUrlFilters {
  return {
    statuses:
      executionStatusParam.parse(
        queryText(query[EXECUTION_LIST_QUERY_KEYS.status]).toLowerCase(),
      ) ?? [],
    period: parseListUrlPeriod(query[EXECUTION_LIST_QUERY_KEYS.period]),
  };
}

/** The API's status casing varies (`Failed`, `failed`), so compare lowercase. */
export function matchesExecutionStatus(
  status: string | null | undefined,
  statuses: readonly ExecutionStatusFilter[],
): boolean {
  if (!statuses.length) return true;
  const value = status?.toLowerCase();
  return statuses.some((s) => s === value);
}

/** `/orchestrator/executions?status=failed&period=24h` */
export function executionListLink(
  filters: Partial<ExecutionListUrlFilters> = {},
): string {
  return listLink(entityListUrl('execution'), {
    [EXECUTION_LIST_QUERY_KEYS.status]: filters.statuses?.join(','),
    [EXECUTION_LIST_QUERY_KEYS.period]: filters.period ?? undefined,
  });
}
