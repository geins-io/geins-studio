<script setup lang="ts">
import type {
  VersionComparison,
  VersionDiffChange,
  ExecutionLog,
  WorkflowHistory,
  WorkflowNode,
  WorkflowNodeConnection,
  WorkflowSettings,
  WorkflowTriggerConfig,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

const props = defineProps<{
  workflowId: string;
  workflowName: string;
  isNew: boolean;
}>();

const { orchestratorApi } = useGeinsRepository();
const { t } = useI18n();

// ─── Date formatting ──────────────────────────────────────────────
const pad = (n: number, len = 2) => String(n).padStart(len, '0');

const formatDate = (iso: string | undefined): string => {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const relativeTime = (iso: string | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t('workflow_builder.just_now');
  if (mins < 60) return t('workflow_builder.minutes_ago', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('workflow_builder.hours_ago', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t('workflow_builder.days_ago', { count: days });
  return formatDate(iso);
};

// ─── Fetch version history ────────────────────────────────────────
const {
  data: historyRaw,
  pending: historyLoading,
  refresh: refreshHistory,
} = useLazyAsyncData(
  () => `workflow-history-${props.workflowId}`,
  () =>
    props.isNew
      ? Promise.resolve({ workflowId: '', versions: [] })
      : orchestratorApi.version.getHistory(props.workflowId),
  { default: () => ({ workflowId: '', versions: [] }) },
);

// ─── Fetch execution logs for per-version stats ───────────────────
const { data: executionLogs } = useLazyAsyncData(
  () => `workflow-version-executions-${props.workflowId}`,
  () =>
    props.isNew
      ? Promise.resolve([])
      : orchestratorApi.execution.list({
          workflowId: props.workflowId,
          limit: 250,
        }),
  { default: () => [] as ExecutionLog[] },
);

interface VersionStats {
  totalExecutions: number;
  succeeded: number;
  failed: number;
  successRate: number;
  avgDurationMs: number;
  lastRun: string | null;
}

type LegacyVersionLog = ExecutionLog & { WorkflowVersion?: string | number };
type LegacyVersionEntry = Record<string, unknown>;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;

const historyEntries = computed<LegacyVersionEntry[]>(() => {
  const raw = historyRaw.value as
    | WorkflowHistory
    | { items?: unknown[] }
    | unknown[]
    | null;
  if (Array.isArray(raw)) return raw.filter(asRecord) as LegacyVersionEntry[];
  if (raw && typeof raw === 'object') {
    if (Array.isArray((raw as { items?: unknown[] }).items)) {
      return (raw as { items: unknown[] }).items.filter(
        asRecord,
      ) as LegacyVersionEntry[];
    }
    if (Array.isArray((raw as WorkflowHistory).versions)) {
      return (raw as WorkflowHistory).versions.map(
        (v) => v as unknown as LegacyVersionEntry,
      );
    }
  }
  return [];
});

const readVersionNumber = (entry: LegacyVersionEntry): number =>
  Number(entry.version ?? entry.Version ?? 0);

const readDefinition = (
  entry: LegacyVersionEntry,
): Record<string, unknown> | null =>
  asRecord(entry.definition ?? entry.Definition);

const versionStats = computed<Record<number, VersionStats>>(() => {
  const logs = executionLogs.value as ExecutionLog[];
  if (!logs?.length) return {};

  const grouped: Record<number, ExecutionLog[]> = {};
  for (const log of logs) {
    const legacy = log as LegacyVersionLog;
    const ver = Number(log.workflowVersion ?? legacy.WorkflowVersion ?? 0);
    if (ver <= 0) continue;
    if (!grouped[ver]) grouped[ver] = [];
    grouped[ver]!.push(log);
  }

  const stats: Record<number, VersionStats> = {};
  for (const [verStr, verLogs] of Object.entries(grouped)) {
    const ver = Number(verStr);
    const total = verLogs.length;
    const succeeded = verLogs.filter((l) => {
      const s = (l.status ?? '').toLowerCase();
      return s === 'completed' || s === 'continuedasnew';
    }).length;
    const failed = verLogs.filter((l) => {
      const s = (l.status ?? '').toLowerCase();
      return s === 'failed' || s === 'timedout' || s === 'terminated';
    }).length;
    const durations = verLogs
      .map((l) => l.durationMs ?? 0)
      .filter((d) => d > 0);
    const avgDurationMs = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    const lastRun =
      verLogs
        .map((l) => l.startTime)
        .filter(Boolean)
        .sort()
        .pop() ?? null;

    stats[ver] = {
      totalExecutions: total,
      succeeded,
      failed,
      successRate: total > 0 ? Math.round((succeeded / total) * 100) : 0,
      avgDurationMs,
      lastRun,
    };
  }
  return stats;
});

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
}

interface VersionRow {
  version: number;
  timestamp: string;
  relative: string;
  author: string | null;
  nodeCount: number;
  connectionCount: number;
  isCurrent: boolean;
  stats: VersionStats | null;
}

const versions = computed<VersionRow[]>(() => {
  const sorted = historyEntries.value
    .map((v) => {
      const definition = readDefinition(v);
      const nodes = definition
        ? Array.isArray(definition.nodes)
          ? definition.nodes
          : Array.isArray(definition.Nodes)
            ? definition.Nodes
            : []
        : [];
      const connections = definition
        ? Array.isArray(definition.connections)
          ? definition.connections
          : Array.isArray(definition.Connections)
            ? definition.Connections
            : []
        : [];
      const version = readVersionNumber(v);
      return {
        version,
        timestamp: formatDate(
          (v.archivedAt ?? v.createdAt ?? v.CreatedAt) as string | undefined,
        ),
        relative: relativeTime(
          (v.archivedAt ?? v.createdAt ?? v.CreatedAt) as string | undefined,
        ),
        author: (v.archivedBy ?? v.createdBy ?? v.CreatedBy ?? null) as
          | string
          | null,
        nodeCount: nodes.length,
        connectionCount: connections.length,
        stats: versionStats.value[version] ?? null,
      };
    })
    .sort((a, b) => b.version - a.version);

  return sorted.map((v, index) => ({ ...v, isCurrent: index === 0 }));
});

// ─── Store raw definitions for diff computation ──────────────────
const definitionsByVersion = computed<Record<number, Record<string, unknown>>>(
  () => {
    const map: Record<number, Record<string, unknown>> = {};
    for (const v of historyEntries.value) {
      const ver = readVersionNumber(v);
      const def = readDefinition(v);
      if (ver > 0 && def) {
        map[ver] = def;
      }
    }
    return map;
  },
);

// ─── Client-side JSON diff ────────────────────────────────────────
function diffDefinitions(
  oldDef: Record<string, unknown>,
  newDef: Record<string, unknown>,
  prefix = '',
): VersionDiffChange[] {
  const changes: VersionDiffChange[] = [];

  const allKeys = new Set([...Object.keys(oldDef), ...Object.keys(newDef)]);
  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const oldVal = oldDef[key];
    const newVal = newDef[key];

    if (!(key in oldDef)) {
      changes.push({ path, type: 'added', to: newVal });
    } else if (!(key in newDef)) {
      changes.push({ path, type: 'removed', from: oldVal });
    } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      // Compare arrays by length and stringified content
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        if (oldVal.length !== newVal.length) {
          changes.push({
            path,
            type: 'changed',
            from: `${oldVal.length} items`,
            to: `${newVal.length} items`,
          });
        }
        // Diff individual array items
        const maxLen = Math.max(oldVal.length, newVal.length);
        for (let i = 0; i < maxLen; i++) {
          const itemPath = `${path}[${i}]`;
          if (i >= oldVal.length) {
            changes.push({ path: itemPath, type: 'added', to: newVal[i] });
          } else if (i >= newVal.length) {
            changes.push({ path: itemPath, type: 'removed', from: oldVal[i] });
          } else if (
            typeof oldVal[i] === 'object' &&
            typeof newVal[i] === 'object' &&
            oldVal[i] &&
            newVal[i]
          ) {
            changes.push(
              ...diffDefinitions(
                oldVal[i] as Record<string, unknown>,
                newVal[i] as Record<string, unknown>,
                itemPath,
              ),
            );
          } else if (JSON.stringify(oldVal[i]) !== JSON.stringify(newVal[i])) {
            changes.push({
              path: itemPath,
              type: 'changed',
              from: oldVal[i],
              to: newVal[i],
            });
          }
        }
      }
    } else if (
      typeof oldVal === 'object' &&
      oldVal !== null &&
      typeof newVal === 'object' &&
      newVal !== null &&
      !Array.isArray(oldVal) &&
      !Array.isArray(newVal)
    ) {
      changes.push(
        ...diffDefinitions(
          oldVal as Record<string, unknown>,
          newVal as Record<string, unknown>,
          path,
        ),
      );
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ path, type: 'changed', from: oldVal, to: newVal });
    }
  }

  return changes;
}

// ─── Expandable diffs ─────────────────────────────────────────────
const expandedVersions = ref<Set<number>>(new Set());
const diffCache = ref<Record<number, VersionDiffChange[]>>({});
const diffLoading = ref<Record<number, boolean>>({});
const diffErrors = ref<Record<number, string>>({});

const recreatingVersion = ref<number | null>(null);
const recreatedWorkflows = ref<Record<number, { id: string; name: string }>>(
  {},
);
const { toast } = useToast();

async function recreateFromVersion(version: number) {
  recreatingVersion.value = version;
  try {
    const def = definitionsByVersion.value[version];
    if (!def) {
      toast({
        title: t('workflow_builder.version_data_unavailable'),
        variant: 'negative',
      });
      return;
    }

    const nodes = (def.nodes ?? def.Nodes ?? []) as WorkflowNode[];
    const connections = (def.connections ??
      def.Connections ??
      []) as WorkflowNodeConnection[];
    const settings = (def.settings ?? def.Settings) as
      | WorkflowSettings
      | undefined;
    const trigger = (def.trigger ?? def.Trigger) as
      | WorkflowTriggerConfig
      | undefined;

    const name = `${props.workflowName} - v${version}`;
    const created = await orchestratorApi.workflow.create({
      name,
      type: 'onDemand',
      enabled: false,
      nodes,
      connections,
      ...(settings ? { settings } : {}),
      ...(trigger ? { trigger } : {}),
    });

    recreatedWorkflows.value[version] = {
      id: created.id,
      name: created.name ?? name,
    };
    toast({
      title: t('workflow_builder.workflow_created'),
      description: t('workflow_builder.workflow_created_description', {
        name: created.name ?? name,
      }),
    });
  } catch {
    // Error toast shown globally by $geinsApi.
  } finally {
    recreatingVersion.value = null;
  }
}

function toggleVersion(version: number) {
  if (expandedVersions.value.has(version)) {
    expandedVersions.value.delete(version);
  } else {
    expandedVersions.value.add(version);
    if (!diffCache.value[version] && version > 1) {
      loadDiff(version);
    }
  }
}

async function loadDiff(version: number) {
  diffLoading.value[version] = true;
  diffErrors.value[version] = '';
  try {
    const oldDef = definitionsByVersion.value[version - 1];
    const newDef = definitionsByVersion.value[version];

    if (!oldDef || !newDef) {
      // Fall back to server-side diff API
      const result = await orchestratorApi.version.compare(
        props.workflowId,
        version - 1,
        version,
      );
      const legacyResult = result as VersionComparison & {
        Changes?: unknown[];
      };
      const changes = Array.isArray(legacyResult.changes)
        ? legacyResult.changes
        : Array.isArray(legacyResult.Changes)
          ? legacyResult.Changes
          : [];
      diffCache.value[version] = changes.map((change) => {
        const c = asRecord(change) ?? {};
        return {
          path: String(c.path ?? c.Path ?? ''),
          type: String(
            c.type ?? c.Type ?? 'changed',
          ) as VersionDiffChange['type'],
          from: c.from ?? c.From ?? c.oldValue ?? c.OldValue,
          to: c.to ?? c.To ?? c.newValue ?? c.NewValue,
        };
      });
    } else {
      // Client-side diff from definition snapshots
      diffCache.value[version] = diffDefinitions(oldDef, newDef);
    }
  } catch (err) {
    diffErrors.value[version] =
      err instanceof Error
        ? err.message
        : t('workflow_builder.failed_to_load_diff');
  } finally {
    diffLoading.value[version] = false;
  }
}

// ─── Diff grouping helpers ────────────────────────────────────────
interface DiffGroup {
  label: string;
  icon: string; // lucide icon name
  changes: VersionDiffChange[];
}

function groupChanges(changes: VersionDiffChange[]): DiffGroup[] {
  const groups: Record<string, VersionDiffChange[]> = {
    nodes: [],
    connections: [],
    trigger: [],
    settings: [],
    other: [],
  };

  for (const c of changes) {
    const p = c.path.toLowerCase();
    if (p.startsWith('nodes[') || p.startsWith('nodes.') || p === 'nodes') {
      groups.nodes!.push(c);
    } else if (
      p.startsWith('connections[') ||
      p.startsWith('connections.') ||
      p === 'connections'
    ) {
      groups.connections!.push(c);
    } else if (
      p.startsWith('trigger.') ||
      p.startsWith('trigger[') ||
      p === 'trigger'
    ) {
      groups.trigger!.push(c);
    } else if (
      p.startsWith('settings.') ||
      p.startsWith('settings[') ||
      p === 'settings'
    ) {
      groups.settings!.push(c);
    } else {
      groups.other!.push(c);
    }
  }

  const result: DiffGroup[] = [];
  if (groups.nodes!.length)
    result.push({
      label: t('workflow_builder.diff_group_nodes'),
      icon: 'boxes',
      changes: groups.nodes!,
    });
  if (groups.connections!.length)
    result.push({
      label: t('workflow_builder.diff_group_connections'),
      icon: 'cable',
      changes: groups.connections!,
    });
  if (groups.trigger!.length)
    result.push({
      label: t('workflows.trigger'),
      icon: 'zap',
      changes: groups.trigger!,
    });
  if (groups.settings!.length)
    result.push({
      label: t('settings'),
      icon: 'settings',
      changes: groups.settings!,
    });
  if (groups.other!.length)
    result.push({
      label: t('workflow_builder.diff_group_other'),
      icon: 'file-text',
      changes: groups.other!,
    });
  return result;
}

/** Human-readable short path: nodes[0].name → Node 0: name */
function prettyPath(path: string): string {
  return (
    path
      .replace(/^nodes\[(\d+)\]\.?/, 'Node $1: ')
      .replace(/^connections\[(\d+)\]\.?/, 'Connection $1: ')
      .replace(/^trigger\.?/, '')
      .replace(/^settings\.?/, '') || path
  );
}

/** Truncate a JSON value for display */
function truncateValue(val: unknown): string {
  if (val === undefined || val === null) return '—';
  const str = typeof val === 'string' ? val : JSON.stringify(val);
  return str.length > 80 ? `${str.slice(0, 77)}…` : str;
}
</script>

<template>
  <ContentEditMainContent>
    <ContentEditCard
      :title="$t('workflow_builder.version_history')"
      :description="
        $t('workflow_builder.version_count', { count: versions.length })
      "
    >
      <template #header-action>
        <Button
          variant="secondary"
          size="sm"
          :disabled="historyLoading"
          @click="refreshHistory()"
        >
          <LucideRefreshCw
            class="mr-2 h-3.5 w-3.5"
            :class="{ 'animate-spin': historyLoading }"
          />
          {{ $t('workflow_builder.refresh') }}
        </Button>
      </template>

      <!-- Loading skeleton -->
      <div v-if="historyLoading && versions.length === 0" class="space-y-3">
        <div v-for="n in 4" :key="n" class="rounded-lg border p-4">
          <div class="flex items-center gap-3">
            <Skeleton class="h-5 w-10" />
            <Skeleton class="h-4 w-32" />
            <div class="flex-1" />
            <Skeleton class="h-4 w-24" />
          </div>
        </div>
      </div>

      <!-- Version list -->
      <div v-else class="space-y-2">
        <div
          v-for="entry in versions"
          :key="entry.version"
          class="rounded-lg border transition-colors"
          :class="{
            'border-primary/20 bg-primary/[0.02]': expandedVersions.has(
              entry.version,
            ),
          }"
        >
          <!-- Row header (always visible) -->
          <button
            class="hover:bg-muted/40 flex w-full items-center gap-3 p-3 text-left transition-colors"
            @click="toggleVersion(entry.version)"
          >
            <!-- Version badge -->
            <div class="flex items-center gap-1.5">
              <LucideGitCommit class="text-muted-foreground h-4 w-4" />
              <span class="text-sm font-semibold tabular-nums">
                v{{ entry.version }}
              </span>
            </div>

            <!-- Current badge -->
            <Badge
              v-if="entry.isCurrent"
              variant="outline"
              size="sm"
              class="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            >
              {{ $t('workflow_builder.current') }}
            </Badge>

            <!-- Node/connection counts -->
            <div
              v-if="entry.nodeCount > 0"
              class="text-muted-foreground hidden items-center gap-1 text-xs sm:flex"
            >
              <LucideBoxes class="h-3 w-3" />
              <span>
                {{ $t('workflow_builder.node_count', entry.nodeCount) }}
              </span>
              <span class="mx-0.5">·</span>
              <LucideCable class="h-3 w-3" />
              <span>{{ entry.connectionCount }}</span>
            </div>

            <!-- Execution stats (compact) -->
            <div
              v-if="entry.stats"
              class="hidden items-center gap-1.5 text-xs md:flex"
            >
              <span class="text-muted-foreground/50">│</span>
              <LucideActivity class="text-muted-foreground h-3 w-3" />
              <span
                class="tabular-nums"
                :class="{
                  'text-emerald-600 dark:text-emerald-400':
                    entry.stats.successRate >= 90,
                  'text-amber-600 dark:text-amber-400':
                    entry.stats.successRate >= 50 &&
                    entry.stats.successRate < 90,
                  'text-red-600 dark:text-red-400':
                    entry.stats.successRate < 50,
                }"
              >
                {{ entry.stats.successRate }}%
              </span>
              <span class="text-muted-foreground tabular-nums">
                ({{ entry.stats.totalExecutions }})
              </span>
            </div>

            <div class="flex-1" />

            <!-- Author -->
            <span
              v-if="entry.author"
              class="text-muted-foreground hidden text-xs lg:inline"
            >
              {{ entry.author }}
            </span>

            <!-- Timestamp -->
            <span
              class="text-muted-foreground shrink-0 text-xs tabular-nums"
              :title="entry.timestamp"
            >
              {{ entry.relative || entry.timestamp }}
            </span>

            <!-- Expand chevron -->
            <LucideChevronDown
              class="text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': expandedVersions.has(entry.version) }"
            />
          </button>

          <!-- Expanded diff panel -->
          <div
            v-if="expandedVersions.has(entry.version)"
            class="border-t px-4 py-3"
          >
            <!-- Execution stats detail panel -->
            <div v-if="entry.stats" class="bg-muted/30 mb-3 rounded-md p-3">
              <div
                class="text-muted-foreground mb-2 text-[11px] font-medium tracking-wider uppercase"
              >
                {{ $t('workflow_builder.execution_stats') }}
              </div>
              <div class="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
                <div>
                  <div class="text-muted-foreground text-[10px] uppercase">
                    {{ $t('workflow_builder.runs') }}
                  </div>
                  <div class="text-sm font-medium tabular-nums">
                    {{ entry.stats.totalExecutions }}
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground text-[10px] uppercase">
                    {{ $t('workflows.success_rate') }}
                  </div>
                  <div
                    class="text-sm font-medium tabular-nums"
                    :class="{
                      'text-emerald-600 dark:text-emerald-400':
                        entry.stats.successRate >= 90,
                      'text-amber-600 dark:text-amber-400':
                        entry.stats.successRate >= 50 &&
                        entry.stats.successRate < 90,
                      'text-red-600 dark:text-red-400':
                        entry.stats.successRate < 50,
                    }"
                  >
                    {{ entry.stats.successRate }}%
                    <span class="text-muted-foreground text-xs font-normal">
                      ({{ entry.stats.succeeded }}/{{
                        entry.stats.totalExecutions
                      }})
                    </span>
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground text-[10px] uppercase">
                    {{ $t('workflow_builder.avg_duration') }}
                  </div>
                  <div class="text-sm font-medium tabular-nums">
                    {{
                      entry.stats.avgDurationMs > 0
                        ? formatDuration(entry.stats.avgDurationMs)
                        : '—'
                    }}
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground text-[10px] uppercase">
                    {{ $t('workflow_builder.status_failed') }}
                  </div>
                  <div
                    class="text-sm font-medium tabular-nums"
                    :class="{
                      'text-red-600 dark:text-red-400': entry.stats.failed > 0,
                    }"
                  >
                    {{ entry.stats.failed }}
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else
              class="text-muted-foreground bg-muted/30 mb-3 flex items-center gap-2 rounded-md p-3 text-xs"
            >
              <LucideActivity class="h-3.5 w-3.5" />
              {{ $t('workflow_builder.no_executions_for_version') }}
            </div>

            <!-- Recreate from version -->
            <div class="mb-3 flex items-center justify-end">
              <Button
                v-if="recreatedWorkflows[entry.version]"
                variant="link"
                size="sm"
                class="text-primary h-auto gap-1.5 p-0 text-xs"
                @click.stop="
                  navigateTo(
                    `/orchestrator/workflows/${recreatedWorkflows[entry.version]!.id}`,
                  )
                "
              >
                <LucideExternalLink class="h-3.5 w-3.5" />
                {{ recreatedWorkflows[entry.version]!.name }}
              </Button>
              <Button
                v-else
                variant="outline"
                size="sm"
                :disabled="
                  recreatingVersion !== null ||
                  !definitionsByVersion[entry.version]
                "
                :loading="recreatingVersion === entry.version"
                @click.stop="recreateFromVersion(entry.version)"
              >
                <LucideCopyPlus class="mr-1.5 h-3.5 w-3.5" />
                {{
                  $t('workflow_builder.recreate_as_version', {
                    version: entry.version,
                  })
                }}
              </Button>
            </div>

            <!-- First version: no diff available -->
            <div
              v-if="entry.version <= 1"
              class="text-muted-foreground flex items-center gap-2 py-2 text-sm"
            >
              <LucideSparkles class="h-4 w-4 text-amber-500" />
              {{ $t('workflow_builder.initial_version') }}
            </div>

            <!-- Loading diff -->
            <div v-else-if="diffLoading[entry.version]" class="space-y-2 py-2">
              <div v-for="n in 3" :key="n" class="flex items-center gap-2">
                <Skeleton class="h-4 w-4 rounded" />
                <Skeleton class="h-3 w-48" />
              </div>
            </div>

            <!-- Diff error -->
            <div
              v-else-if="diffErrors[entry.version]"
              class="flex items-center gap-2 py-2 text-sm text-red-500"
            >
              <LucideAlertCircle class="h-4 w-4" />
              {{ diffErrors[entry.version] }}
              <Button
                variant="ghost"
                size="sm"
                class="ml-2 h-6 px-2 text-xs"
                @click="loadDiff(entry.version)"
              >
                {{ $t('retry') }}
              </Button>
            </div>

            <!-- Diff content -->
            <div v-else-if="diffCache[entry.version]" class="space-y-3">
              <!-- No changes -->
              <div
                v-if="diffCache[entry.version]!.length === 0"
                class="text-muted-foreground flex items-center gap-2 py-2 text-sm"
              >
                <LucideEqual class="h-4 w-4" />
                {{
                  $t('workflow_builder.no_changes_between_versions', {
                    from: entry.version - 1,
                    to: entry.version,
                  })
                }}
              </div>

              <!-- Grouped changes -->
              <template v-else>
                <div class="text-muted-foreground mb-2 text-xs">
                  {{
                    $t(
                      'workflow_builder.changes_from_version',
                      { from: entry.version - 1 },
                      diffCache[entry.version]!.length,
                    )
                  }}
                </div>

                <div
                  v-for="group in groupChanges(diffCache[entry.version]!)"
                  :key="group.label"
                  class="space-y-1"
                >
                  <!-- Group header -->
                  <div
                    class="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-wider uppercase"
                  >
                    <span>{{ group.label }}</span>
                    <span class="text-muted-foreground/50">
                      ({{ group.changes.length }})
                    </span>
                  </div>

                  <!-- Individual changes -->
                  <div
                    v-for="(change, ci) in group.changes"
                    :key="ci"
                    class="flex items-start gap-2 rounded px-2 py-1 text-xs"
                    :class="{
                      'bg-emerald-500/5': change.type === 'added',
                      'bg-red-500/5': change.type === 'removed',
                      'bg-amber-500/5': change.type === 'changed',
                    }"
                  >
                    <!-- Change type indicator -->
                    <span
                      class="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                      :class="{
                        'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400':
                          change.type === 'added',
                        'bg-red-500/20 text-red-600 dark:text-red-400':
                          change.type === 'removed',
                        'bg-amber-500/20 text-amber-600 dark:text-amber-400':
                          change.type === 'changed',
                      }"
                    >
                      {{
                        change.type === 'added'
                          ? '+'
                          : change.type === 'removed'
                            ? '−'
                            : '~'
                      }}
                    </span>

                    <!-- Path -->
                    <span class="text-foreground min-w-0 font-mono">
                      {{ prettyPath(change.path) }}
                    </span>

                    <!-- Values (for changed type) -->
                    <template v-if="change.type === 'changed'">
                      <span class="text-muted-foreground shrink-0">→</span>
                      <span
                        class="text-muted-foreground min-w-0 truncate"
                        :title="String(change.to ?? '')"
                      >
                        {{ truncateValue(change.to) }}
                      </span>
                    </template>

                    <!-- Value (for added) -->
                    <span
                      v-else-if="change.type === 'added'"
                      class="text-muted-foreground min-w-0 truncate"
                      :title="String(change.to ?? '')"
                    >
                      {{ truncateValue(change.to) }}
                    </span>

                    <!-- Value (for removed) -->
                    <span
                      v-else-if="change.type === 'removed'"
                      class="text-muted-foreground min-w-0 truncate line-through"
                      :title="String(change.from ?? '')"
                    >
                      {{ truncateValue(change.from) }}
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="versions.length === 0"
          class="text-muted-foreground py-12 text-center text-sm"
        >
          {{ $t('workflow_builder.no_version_history') }}
        </div>
      </div>
    </ContentEditCard>
  </ContentEditMainContent>
</template>
