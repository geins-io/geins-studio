import type {
  EditorManifest,
  ManifestActionCategory,
  ManifestEventEntity,
  ManifestNodeType,
  ManifestTriggerType,
  WorkflowAction,
} from '#shared/types'

/**
 * Fetches the orchestrator editor manifest (GET /orchestrator/manifest) once
 * per app session and exposes it as a shared async data source. Every caller
 * gets the same underlying `useAsyncData` instance via the stable key, so
 * the request only goes out on the first call.
 *
 * The manifest describes all node types, actions (with input/output schemas),
 * action categories, trigger types, event entities, expression functions and
 * enums — i.e. everything the node palette and node renderers need to stop
 * relying on mocked data.
 *
 * Note: the live API returns some fields the shared `WorkflowAction` type
 * does not declare yet (e.g. `input: ManifestActionInputField[]` instead of
 * `parameters`, `isPseudoAction`). Consumers that touch those extras should
 * normalize at the call site.
 */

export type ManifestAction = WorkflowAction & {
  isPseudoAction?: boolean
  input?: Array<{
    name: string
    type: string
    description?: string
    required?: boolean
    default?: unknown
    allowedValues?: string[] | number[]
    schema?: Record<string, unknown>
    editorHint?: string
  }>
}

export function useWorkflowManifest() {
  const { orchestratorApi } = useGeinsRepository()

  const { data, pending, error, refresh } = useAsyncData<EditorManifest | null>(
    'orchestrator-manifest',
    () => orchestratorApi.editor.getManifest(),
    {
      default: () => null,
      // Manifest is effectively static per session; skip re-fetching on HMR.
      getCachedData: (key, nuxtApp) =>
        (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as EditorManifest | null,
    },
  )

  const manifest = computed(() => data.value ?? null)

  // --- Convenience lookups (all reactive, all O(1) after first resolve) ---

  const nodeTypes = computed<ManifestNodeType[]>(
    () => (manifest.value?.nodeTypes as ManifestNodeType[] | undefined) ?? [],
  )

  const actions = computed<ManifestAction[]>(
    () => (manifest.value?.actions as ManifestAction[] | undefined) ?? [],
  )

  const triggerTypes = computed<ManifestTriggerType[]>(
    () => (manifest.value?.triggerTypes as ManifestTriggerType[] | undefined) ?? [],
  )

  const eventEntities = computed<ManifestEventEntity[]>(
    () => (manifest.value?.eventEntities as ManifestEventEntity[] | undefined) ?? [],
  )

  const actionCategories = computed<ManifestActionCategory[]>(
    () => (manifest.value?.actionCategories as ManifestActionCategory[] | undefined) ?? [],
  )

  const actionsByName = computed(() => {
    const map = new Map<string, ManifestAction>()
    for (const a of actions.value) map.set(a.name, a)
    return map
  })

  const actionsByCategory = computed(() => {
    const map = new Map<string, ManifestAction[]>()
    for (const a of actions.value) {
      const list = map.get(a.category)
      if (list) list.push(a)
      else map.set(a.category, [a])
    }
    return map
  })

  const nodeTypesByType = computed(() => {
    const map = new Map<string, ManifestNodeType>()
    for (const n of nodeTypes.value) map.set(n.type, n)
    return map
  })

  const getAction = (name: string | undefined | null): ManifestAction | undefined =>
    name ? actionsByName.value.get(name) : undefined

  const getNodeType = (type: string | undefined | null): ManifestNodeType | undefined =>
    type ? nodeTypesByType.value.get(type) : undefined

  return {
    manifest,
    loading: pending,
    error,
    refresh,
    nodeTypes,
    actions,
    triggerTypes,
    eventEntities,
    actionCategories,
    actionsByName,
    actionsByCategory,
    nodeTypesByType,
    getAction,
    getNodeType,
  }
}

export type UseWorkflowManifestReturnType = ReturnType<typeof useWorkflowManifest>
