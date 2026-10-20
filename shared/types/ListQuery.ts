// Endpoint-agnostic state for server-driven lists. Each repo adapter maps this
// onto its own request body; the response is always `BatchQueryResult<T>`.

export type ListSortDirection = 'asc' | 'desc';

export interface ListSort {
  /** The column id — the adapter maps it to the endpoint's sort field. */
  field: string;
  direction: ListSortDirection;
}

export interface ListQueryState<TFilters = Record<string, never>> {
  /** 1-based, like `BatchQuery.page` and `PaginationBar`. */
  page: number;
  pageSize: number;
  /** `null` = the endpoint's default sort. */
  sort: ListSort | null;
  /** `''` = no search. */
  search: string;
  filters: TFilters;
}

export interface ListQueryRequestOptions {
  /** Batch to continue paging; omitted starts a new batch. */
  batchId?: string;
  signal?: AbortSignal;
}
