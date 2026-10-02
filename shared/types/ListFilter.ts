// Generic filter model for lists — drives both server mode (`useListQuery`
// filters → the repo adapter) and client mode (`matchesListFilters`).

export type ListFilterKind = 'multiselect' | 'dateRange';

export interface ListFilterOption {
  value: string;
  /** Display text, already translated (option values usually come from data). */
  label: string;
  /** Lucide icon name. */
  icon?: string;
}

export type ListDateRangePreset = 'today' | 'week' | 'month';

/**
 * A preset or a custom `from`/`to` (ISO date-times, inclusive). A preset is
 * resolved to concrete dates when the query is sent — `resolveListDateRange`.
 */
export interface ListDateRange {
  from?: string;
  to?: string;
  preset?: ListDateRangePreset;
}

/** Keys of `T` whose (non-nullable) value type is assignable to `V`. */
export type ListFilterKeysOfType<T, V> = {
  [K in keyof T]-?: NonNullable<T[K]> extends V ? K : never;
}[keyof T] &
  keyof T &
  string;

interface ListFilterDefinitionBase {
  /** i18n key, resolved in the UI — never a translated string. */
  label: string;
  /** Lucide icon name; defaults per kind (`listFilterIcon`). */
  icon?: string;
  /** Default `true`. */
  pinnable?: boolean;
  /** URL query key; defaults to `name`. */
  urlKey?: string;
}

export interface ListFilterMultiselectDefinition<
  TFilters,
> extends ListFilterDefinitionBase {
  kind: 'multiselect';
  name: ListFilterKeysOfType<TFilters, string[]>;
  options: ListFilterOption[] | (() => Promise<ListFilterOption[]>);
  /** Default: more than 10 options. */
  searchable?: boolean;
}

export interface ListFilterDateRangeDefinition<
  TFilters,
> extends ListFilterDefinitionBase {
  kind: 'dateRange';
  name: ListFilterKeysOfType<TFilters, ListDateRange>;
}

export type ListFilterDefinition<TFilters> =
  | ListFilterMultiselectDefinition<TFilters>
  | ListFilterDateRangeDefinition<TFilters>;

/** Name of any filter in a definition list. */
export type ListFilterName<TFilters> = ListFilterDefinition<TFilters>['name'];

/** Options of one multiselect filter, loaded once when async. */
export interface ListFilterOptionsState {
  options: ListFilterOption[];
  pending: boolean;
  error: unknown;
  /** Retry after an error. */
  reload: () => Promise<void>;
}
