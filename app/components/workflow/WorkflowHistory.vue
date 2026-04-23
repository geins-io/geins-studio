<script setup lang="ts">
const props = defineProps<{
  workflowId: string
  isNew: boolean
}>()

const { orchestratorApi } = useGeinsRepository()

const pad = (n: number, len = 2) => String(n).padStart(len, '0')

const formatCreatedAt = (iso: string | undefined): string => {
  if (!iso) return '–'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

const { data: historyRaw, pending: historyLoading, refresh: refreshHistory } = useLazyAsyncData(
  () => `workflow-history-${props.workflowId}`,
  () => props.isNew
    ? Promise.resolve({ workflowId: '', versions: [] })
    : orchestratorApi.version.getHistory(props.workflowId),
  { default: () => ({ workflowId: '', versions: [] }) },
)

const historyVersions = computed(() => {
  const raw = historyRaw.value as any
  const list: any[] = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.versions)
      ? raw.versions
      : Array.isArray(raw)
        ? raw
        : []
  return list
    .map((v: any) => ({
      version: v.version ?? v.Version,
      createdAt: formatCreatedAt(v.archivedAt ?? v.createdAt ?? v.CreatedAt),
      createdBy: v.archivedBy || v.createdBy || v.CreatedBy || null,
      description: v.description ?? v.Description ?? null,
    }))
    .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
})
</script>

<template>
  <ContentEditMainContent>
    <ContentEditCard title="Version history" :description="`(${historyVersions.length})`">
      <template #header-action>
        <Button variant="secondary" size="sm" :disabled="historyLoading" @click="refreshHistory()">
          <LucideRefreshCw class="mr-2 h-3.5 w-3.5" :class="{ 'animate-spin': historyLoading }" />
          Refresh
        </Button>
      </template>
      <div v-if="historyLoading && historyVersions.length === 0" class="space-y-3">
        <div v-for="n in 5" :key="n" class="rounded-lg border p-3">
          <Skeleton class="mb-2 h-4 w-16" />
          <Skeleton class="h-3 w-48" />
        </div>
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="entry in historyVersions" :key="entry.version"
          class="grid grid-cols-[6rem_1fr_12rem] items-center gap-4 rounded-lg border p-3">
          <div class="flex items-center gap-2">
            <LucideGitCommit class="text-muted-foreground h-3.5 w-3.5" />
            <span class="text-sm font-medium">v{{ entry.version }}</span>
          </div>
          <div class="text-muted-foreground truncate text-xs">{{ entry.description || '—' }}</div>
          <div class="text-muted-foreground text-right font-mono text-xs">{{ entry.createdAt }}</div>
        </div>
        <div v-if="historyVersions.length === 0" class="text-muted-foreground py-12 text-center text-sm">
          No version history
        </div>
      </div>
    </ContentEditCard>
  </ContentEditMainContent>
</template>
