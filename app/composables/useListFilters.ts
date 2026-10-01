import type {
  ListDateRange,
  ListFilterDefinition,
  ListFilterKeysOfType,
  ListFilterName,
  ListFilterOptionsState,
} from '#shared/types';
import {
  LIST_FILTER_MAX_PINNED,
  isListDateRange,
  listFilterActiveCount,
  listFilterValues,
} from '#shared/utils/list-filter';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';

export interface UseListFiltersOptions<TFilters extends object> {
  definitions: MaybeRefOrGetter<readonly ListFilterDefinition<TFilters>[]>;
  /**
   * Committed state: `useListQuery().filters`, or a local ref in client mode.
   * Replaced on every change, never mutated.
   */
  filters: Ref<TFilters>;
  /** What `clearAll()` calls, e.g. `useListQuery().resetFilters`. Defaults to clearing every defined filter. */
  resetFilters?: () => void;
  /** Used only until the user pins or unpins anything. */
  defaultPinned?: ListFilterName<TFilters>[];
  /** Tells two filter bars on one route apart in the pinned cookie. */
  persistKey?: string;
}

/** Reads and edits over one filter state — committed or staged. */
export interface ListFilterActions<TFilters extends object> {
  /** The state these actions read and write. */
  filters: Ref<TFilters>;
  /** A multiselect's selected values. */
  values: (name: ListFilterName<TFilters>) => string[];
  /** A date range's value, if set. */
  range: (name: ListFilterName<TFilters>) => ListDateRange | undefined;
  /** Selected values of a multiselect; 1 or 0 for a date range. */
  activeCount: (name: ListFilterName<TFilters>) => number;
  isActive: (name: ListFilterName<TFilters>) => boolean;
  /** Number of filters with a value. */
  totalActive: ComputedRef<number>;
  toggleValue: (
    name: ListFilterKeysOfType<TFilters, string[]>,
    value: string,
  ) => void;
  setRange: (
    name: ListFilterKeysOfType<TFilters, ListDateRange>,
    range: ListDateRange | undefined,
  ) => void;
  clear: (name: ListFilterName<TFilters>) => void;
  clearAll: () => void;
}

/** A staged copy of the filters; nothing is committed until `apply()`. */
export interface ListFiltersDraft<
  TFilters extends object,
> extends ListFilterActions<TFilters> {
  /** The draft differs from the committed state. */
  dirty: ComputedRef<boolean>;
  apply: () => void;
  /** Back to the committed state. */
  discard: () => void;
}

export interface UseListFiltersReturnType<
  TFilters extends object,
> extends ListFilterActions<TFilters> {
  definitions: ComputedRef<readonly ListFilterDefinition<TFilters>[]>;
  definition: (
    name: ListFilterName<TFilters>,
  ) => ListFilterDefinition<TFilters> | undefined;
  /** Pinned filter names in order, at most `LIST_FILTER_MAX_PINNED`. */
  pinned: ComputedRef<ListFilterName<TFilters>[]>;
  isPinned: (name: ListFilterName<TFilters>) => boolean;
  /** Pinned already, or pinnable with room left. */
  canPin: (name: ListFilterName<TFilters>) => boolean;
  /** A no-op for an unpinnable filter or past the limit. */
  togglePin: (name: ListFilterName<TFilters>) => void;
  /** A multiselect's options; async ones load on the first call, once. */
  resolvedOptions: (name: ListFilterName<TFilters>) => ListFilterOptionsState;
  /** A staged copy for editors that apply later (popover close, sheet "Apply"). */
  stage: () => ListFiltersDraft<TFilters>;
}

/** Same value — `undefined` and an empty array both mean "not set". */
function sameValue(a: unknown, b: unknown): boolean {
  const norm = (v: unknown) =>
    Array.isArray(v) && v.length === 0 ? undefined : v;
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
}

/**
 * The filter-kit state over a list's filters: active counts, value edits,
 * pinned filters (a per-user, per-route cookie, like column options) and
 * async options. Works on `useListQuery().filters` in server mode — so every
 * committed change reaches the URL — or on a local ref in client mode.
 */
export function useListFilters<TFilters extends object>(
  options: UseListFiltersOptions<TFilters>,
): UseListFiltersReturnType<TFilters> {
  const { geinsLogError } = useGeinsLog('useListFilters');

  const definitions = computed(() => toValue(options.definitions));
  const definition = (name: ListFilterName<TFilters>) =>
    definitions.value.find((d) => d.name === name);

  function createActions(
    state: Ref<TFilters>,
    reset?: () => void,
  ): ListFilterActions<TFilters> {
    const write = (name: ListFilterName<TFilters>, value: unknown) => {
      const def = definition(name);
      const next = { ...state.value };
      // Empty values drop the key, so a cleared filter equals the defaults.
      if (def && listFilterActiveCount(def, value))
        Reflect.set(next, name, value);
      else Reflect.deleteProperty(next, name);
      state.value = next;
    };

    const values = (name: ListFilterName<TFilters>) =>
      listFilterValues(state.value[name]);
    const range = (name: ListFilterName<TFilters>) => {
      const value = state.value[name];
      return isListDateRange(value) ? value : undefined;
    };
    const activeCount = (name: ListFilterName<TFilters>) => {
      const def = definition(name);
      return def ? listFilterActiveCount(def, state.value[name]) : 0;
    };

    return {
      filters: state,
      values,
      range,
      activeCount,
      isActive: (name) => activeCount(name) > 0,
      totalActive: computed(
        () =>
          definitions.value.filter((d) =>
            listFilterActiveCount(d, state.value[d.name]),
          ).length,
      ),
      toggleValue: (name, value) => {
        const current = values(name);
        write(
          name,
          current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value],
        );
      },
      setRange: (name, value) => write(name, value),
      clear: (name) => write(name, undefined),
      clearAll: () => {
        if (reset) return reset();
        const next = { ...state.value };
        for (const d of definitions.value) Reflect.deleteProperty(next, d.name);
        state.value = next;
      },
    };
  }

  const committed = createActions(options.filters, options.resetFilters);

  // Pinned
  const pinCookie = useUserRouteCookie<string[] | undefined>(
    options.persistKey
      ? `geins-filters-pinned-${options.persistKey}`
      : 'geins-filters-pinned',
  );
  const pinned = computed<ListFilterName<TFilters>[]>(() => {
    const raw: unknown = Array.isArray(pinCookie.value)
      ? pinCookie.value
      : (options.defaultPinned ?? []);
    const names = Array.isArray(raw) ? raw : [];
    // The cookie may name filters that no longer exist or aren't pinnable.
    const valid = definitions.value
      .filter((d) => d.pinnable !== false)
      .map((d) => d.name);
    return [...new Set(names)]
      .filter((n): n is ListFilterName<TFilters> =>
        valid.some((name) => name === n),
      )
      .slice(0, LIST_FILTER_MAX_PINNED);
  });
  const isPinned = (name: ListFilterName<TFilters>) =>
    pinned.value.includes(name);
  const canPin = (name: ListFilterName<TFilters>) =>
    isPinned(name) ||
    (definition(name)?.pinnable !== false &&
      !!definition(name) &&
      pinned.value.length < LIST_FILTER_MAX_PINNED);
  const togglePin = (name: ListFilterName<TFilters>) => {
    if (isPinned(name))
      pinCookie.value = pinned.value.filter((n) => n !== name);
    else if (canPin(name)) pinCookie.value = [...pinned.value, name];
  };

  // Async options, loaded once per filter
  const optionStates = new Map<string, ListFilterOptionsState>();
  const resolvedOptions = (
    name: ListFilterName<TFilters>,
  ): ListFilterOptionsState => {
    const def = definition(name);
    if (!def || def.kind !== 'multiselect')
      return reactive({
        options: [],
        pending: false,
        error: undefined,
        reload: async () => {},
      });
    const source = def.options;
    if (Array.isArray(source))
      return reactive({
        options: source,
        pending: false,
        error: undefined,
        reload: async () => {},
      });

    const cached = optionStates.get(name);
    if (cached) return cached;
    const state: ListFilterOptionsState = reactive({
      options: [],
      pending: false,
      error: undefined,
      reload: async () => {
        state.pending = true;
        state.error = undefined;
        try {
          state.options = await source();
        } catch (err) {
          geinsLogError(`failed to load options for "${name}"`, err);
          state.error = err;
        } finally {
          state.pending = false;
        }
      },
    });
    optionStates.set(name, state);
    state.reload();
    return state;
  };

  const stage = (): ListFiltersDraft<TFilters> => {
    const box = shallowRef({ current: { ...options.filters.value } });
    const draftState = computed<TFilters>({
      get: () => box.value.current,
      set: (value) => (box.value = { current: value }),
    });
    const draft = createActions(draftState);
    const dirty = computed(() =>
      definitions.value.some(
        (d) =>
          !sameValue(draftState.value[d.name], options.filters.value[d.name]),
      ),
    );
    return {
      ...draft,
      dirty,
      apply: () => {
        if (!dirty.value) return;
        // Merge only the defined filters, so filters set elsewhere survive.
        const next = { ...options.filters.value };
        for (const d of definitions.value) {
          const value = draftState.value[d.name];
          if (value === undefined) Reflect.deleteProperty(next, d.name);
          else Reflect.set(next, d.name, value);
        }
        options.filters.value = next;
      },
      discard: () => {
        draftState.value = { ...options.filters.value };
      },
    };
  };

  return {
    ...committed,
    definitions,
    definition,
    pinned,
    isPinned,
    canPin,
    togglePin,
    resolvedOptions,
    stage,
  };
}
