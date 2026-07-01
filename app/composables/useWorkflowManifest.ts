import type {
  EditorManifest,
  ManifestAuthoringGuide,
  ManifestConfigProperty,
  ManifestEnumValue,
  ManifestEventEntity,
  ManifestExpressionFunction,
  ManifestExpressionVariable,
  ManifestGraphConventions,
  ManifestNode,
  ManifestNodeCategory,
  ManifestProvider,
  ManifestTriggerType,
  RetryPolicy,
} from '#shared/types';

/**
 * Fetches the orchestrator editor manifest (GET /orchestrator/manifest) once
 * per app session and exposes it as a shared async data source. Every caller
 * gets the same underlying `useAsyncData` instance via the stable key, so the
 * request only goes out on the first call.
 *
 * The manifest (schemaVersion 3.x) describes node categories, nodes (with
 * config/output/connection metadata), providers, trigger types, event
 * entities, expression functions/variables, graph conventions, workflow-level
 * settings, and authoring guidance — everything the node palette, node
 * renderers, and config forms need.
 */

const EMPTY_GRAPH_CONVENTIONS: ManifestGraphConventions = {
  triggerSentinel: 'TRIGGER',
  allowMultipleTriggers: true,
};

export function useWorkflowManifest() {
  const { orchestratorApi } = useGeinsRepository();

  const { data, pending, error, refresh } = useAsyncData<EditorManifest | null>(
    'orchestrator-manifest',
    () => orchestratorApi.editor.getManifest(),
    {
      default: () => null,
      // Manifest is effectively static per session; skip re-fetching on HMR.
      getCachedData: (key, nuxtApp) =>
        (nuxtApp.payload.data[key] ??
          nuxtApp.static.data[key]) as EditorManifest | null,
    },
  );

  const manifest = computed(() => data.value ?? null);

  // --- Convenience lookups (all reactive, all O(1) after first resolve) ---

  const nodes = computed<ManifestNode[]>(() => manifest.value?.nodes ?? []);

  /** Node categories — the manifest's `nodeTypes` (network/flow/state/…). */
  const nodeCategories = computed<ManifestNodeCategory[]>(
    () => manifest.value?.nodeTypes ?? [],
  );

  const providers = computed<ManifestProvider[]>(
    () => manifest.value?.providers ?? [],
  );

  const triggerTypes = computed<ManifestTriggerType[]>(
    () => manifest.value?.triggerTypes ?? [],
  );

  const eventEntities = computed<ManifestEventEntity[]>(
    () => manifest.value?.eventEntities ?? [],
  );

  const expressionFunctions = computed<ManifestExpressionFunction[]>(
    () => manifest.value?.expressionFunctions ?? [],
  );

  const expressionVariables = computed<ManifestExpressionVariable[]>(
    () => manifest.value?.expressionVariables ?? [],
  );

  const workflowSettings = computed<ManifestConfigProperty[]>(
    () => manifest.value?.workflowSettings ?? [],
  );

  const graphConventions = computed<ManifestGraphConventions>(
    () => manifest.value?.graphConventions ?? EMPTY_GRAPH_CONVENTIONS,
  );

  const authoring = computed<ManifestAuthoringGuide>(
    () => manifest.value?.authoring ?? {},
  );

  const enums = computed<Record<string, ManifestEnumValue[]>>(
    () => manifest.value?.enums ?? {},
  );

  const nodesByName = computed(() => {
    const map = new Map<string, ManifestNode>();
    for (const n of nodes.value) map.set(n.name, n);
    return map;
  });

  const nodesByFunctionName = computed(() => {
    const map = new Map<string, ManifestNode>();
    for (const n of nodes.value) map.set(n.functionName, n);
    return map;
  });

  /** Nodes grouped by category name (matches `nodeCategories[].name`). */
  const nodesByCategory = computed(() => {
    const map = new Map<string, ManifestNode[]>();
    for (const n of nodes.value) {
      const list = map.get(n.type);
      if (list) list.push(n);
      else map.set(n.type, [n]);
    }
    return map;
  });

  const nodesByProvider = computed(() => {
    const map = new Map<string, ManifestNode[]>();
    for (const n of nodes.value) {
      const list = map.get(n.provider);
      if (list) list.push(n);
      else map.set(n.provider, [n]);
    }
    return map;
  });

  const categoryByName = computed(() => {
    const map = new Map<string, ManifestNodeCategory>();
    for (const c of nodeCategories.value) map.set(c.name, c);
    return map;
  });

  const providersByName = computed(() => {
    const map = new Map<string, ManifestProvider>();
    for (const p of providers.value) map.set(p.name, p);
    return map;
  });

  /** Look up a node by its `functionName` (preferred) or bare `name`. */
  const getNode = (key: string | undefined | null): ManifestNode | undefined =>
    key
      ? (nodesByFunctionName.value.get(key) ?? nodesByName.value.get(key))
      : undefined;

  const getCategory = (
    name: string | undefined | null,
  ): ManifestNodeCategory | undefined =>
    name ? categoryByName.value.get(name) : undefined;

  const getProvider = (
    name: string | undefined | null,
  ): ManifestProvider | undefined =>
    name ? providersByName.value.get(name) : undefined;

  /** Look up a trigger type descriptor by its (PascalCase) `type`, case-insensitively. */
  const getTriggerType = (
    type: string | undefined | null,
  ): ManifestTriggerType | undefined => {
    if (!type) return undefined;
    const lower = type.toLowerCase();
    return triggerTypes.value.find((t) => t.type.toLowerCase() === lower);
  };

  /** Return the values of a named manifest enum (e.g. `LogVerbosity`). */
  const getEnum = (name: string): ManifestEnumValue[] =>
    enums.value[name] ?? [];

  /**
   * The default retry policy, sourced from the `retryPolicy` workflow-setting
   * descriptor's schema. Falls back to the manifest-documented defaults
   * (maxAttempts=3, initialInterval=00:00:05, backoffMultiplier=1.5).
   */
  const defaultRetryPolicy = computed<RetryPolicy>(() => {
    const descriptor = workflowSettings.value.find(
      (s) => s.name === 'retryPolicy',
    );
    const props = (descriptor?.schema?.properties ?? {}) as Record<
      string,
      { default?: unknown }
    >;
    return {
      maxAttempts: Number(props.maxAttempts?.default ?? 3),
      initialInterval: String(props.initialInterval?.default ?? '00:00:05'),
      backoffMultiplier: Number(props.backoffMultiplier?.default ?? 1.5),
    };
  });

  return {
    manifest,
    loading: pending,
    error,
    refresh,
    // collections
    nodes,
    nodeCategories,
    providers,
    triggerTypes,
    eventEntities,
    expressionFunctions,
    expressionVariables,
    workflowSettings,
    graphConventions,
    authoring,
    enums,
    // lookups
    nodesByName,
    nodesByFunctionName,
    nodesByCategory,
    nodesByProvider,
    categoryByName,
    providersByName,
    // getters
    getNode,
    getCategory,
    getProvider,
    getTriggerType,
    getEnum,
    defaultRetryPolicy,
  };
}

export type UseWorkflowManifestReturnType = ReturnType<
  typeof useWorkflowManifest
>;
