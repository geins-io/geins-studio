<script setup lang="ts">
import type {
  WorkflowVariable,
  KitInstallation,
  ColumnOptions,
  StringKeyOf,
} from '#shared/types';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';
import type { Component } from 'vue';
import { LucideKeyRound, LucideEye } from '#components';

export interface VariableListItem {
  key: string;
  displayValue: string;
  description: string;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

type Entity = WorkflowVariable;
type EntityList = VariableListItem;

const scope = 'pages/settings/orchestrator/variables/list.vue';
const { t } = useI18n();
const { geinsLog } = useGeinsLog(scope);

definePageMeta({
  pageType: 'list',
});

// ─── Global Setup ──────────────────────────────────────────────────
const route = useRoute();
const { orchestratorApi } = useGeinsRepository();
const breadcrumbsStore = useBreadcrumbsStore();
const allData = ref<EntityList[]>([]);
const entityName = 'variable';
const loading = ref(true);
const columns = ref<ColumnDef<EntityList>[]>([]);
const visibilityState = ref<VisibilityState>({});

usePageError({ entityName, entityList: true, scope });
const fetchError = ref(false);

watch(
  () => t('navigation.variables'),
  (title) => {
    breadcrumbsStore.setCurrentTitle(title, true);
  },
  { immediate: true },
);

// ─── Fetch Data ────────────────────────────────────────────────────
const {
  data: variables,
  error: variableError,
  refresh,
} = await useAsyncData<Entity[]>(
  'variables-list',
  () => orchestratorApi.variable.list(),
  { getCachedData: () => undefined },
);

// ─── Helpers ───────────────────────────────────────────────────────
const { formatDate } = useDate();

const formatTimestamp = (value: string | undefined): string => {
  if (!value) return '–';
  return formatDate(value) || value;
};

const maskValue = (value: string | undefined): string => {
  if (!value) return '–';
  if (value.length <= 4) return '••••';
  return `${value.slice(0, 2)}••••${value.slice(-2)}`;
};

// ─── Data Mapping ──────────────────────────────────────────────────
const mapToListData = (list: WorkflowVariable[]): EntityList[] =>
  list.map((v) => ({
    key: v.key,
    displayValue: v.isSecret ? maskValue(v.value) : v.value || '–',
    description: v.description ?? '',
    isSecret: v.isSecret,
    createdAt: formatTimestamp(v.createdAt),
    updatedAt: formatTimestamp(v.updatedAt),
  }));

// ─── Kit filter (from query string) ────────────────────────────────
const kitFilter = computed(() => {
  const k = route.query.kit;
  return typeof k === 'string' && k.length > 0 ? k : null;
});

// Resolve the kit installation behind ?kit=<installationId> so the
// filter can match its variable keys and label the banner with the kit name.
const kitInstallation = ref<KitInstallation | null>(null);
watch(
  kitFilter,
  async (installationId) => {
    if (!installationId) {
      kitInstallation.value = null;
      return;
    }
    try {
      const installed = await orchestratorApi.kit.listInstallations();
      const list = Array.isArray(installed) ? installed : [];
      kitInstallation.value =
        list.find((i) => i.id === installationId) ?? null;
    } catch (err) {
      geinsLog('failed to load kit installations for filter', err);
      kitInstallation.value = null;
    }
  },
  { immediate: true },
);

const dataList = computed(() => {
  if (kitFilter.value) {
    const kitVariableKeys = new Set(
      (kitInstallation.value?.variables ?? []).map((v) => v.key),
    );
    return allData.value.filter((item) => kitVariableKeys.has(item.key));
  }
  return allData.value;
});

const clearKitFilter = () => {
  navigateTo('/settings/orchestrator/variables/list');
};

// ─── Table Columns ─────────────────────────────────────────────────
const { getColumns } = useColumns<EntityList>();

onMounted(() => {
  watch(
    [variables, variableError],
    ([newData, newError]) => {
      if (newError) {
        fetchError.value = true;
        allData.value = [];
        return;
      }
      fetchError.value = false;
      const safe: WorkflowVariable[] = Array.isArray(newData) ? newData : [];
      allData.value = mapToListData(safe);
    },
    { immediate: true },
  );

  const resolveSecretIcon = (
    row: EntityList,
  ): { icon: Component; class: string } => {
    return row.isSecret
      ? { icon: LucideKeyRound, class: 'text-yellow-500' }
      : { icon: LucideEye, class: 'text-muted-foreground' };
  };

  const columnOptions: ColumnOptions<EntityList> = {
    columnTypes: {
      key: 'link',
      displayValue: 'code',
      isSecret: 'icon',
    },
    linkColumns: {
      key: { url: '/settings/orchestrator/variables/{id}', idField: 'key' },
    },
    iconColumns: {
      isSecret: { resolveIcon: resolveSecretIcon },
    },
    columnTitles: {
      key: t('variables.key'),
      displayValue: t('variables.value'),
      description: t('variables.description_col'),
      isSecret: t('variables.secret'),
      createdAt: t('created'),
      updatedAt: t('modified'),
    },
  };

  columns.value = getColumns(dataList.value, columnOptions);
  loading.value = false;
});

// ─── Column Visibility ─────────────────────────────────────────────
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = ['createdAt'];
visibilityState.value = getVisibilityState(hiddenColumns);

// ─── Searchable Fields ─────────────────────────────────────────────
const searchableFields: Array<keyof EntityList> = ['key', 'description'];
</script>

<template>
  <ContentHeader
    :title="$t('navigation.variables')"
    :description="$t('variables.description')"
  >
    <ContentActionBar>
      <ButtonIcon icon="new" href="/settings/orchestrator/variables/new">
        {{ $t('new_entity', { entityName }) }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>

  <!-- Active Filter Banner -->
  <div
    v-if="kitFilter"
    class="bg-muted/50 mb-4 flex items-center justify-between rounded-lg border px-4 py-2"
  >
    <div class="flex items-center gap-2 text-sm">
      <LucideFilter class="text-muted-foreground h-4 w-4" />
      <span class="text-muted-foreground">
        {{ $t('workflows.filtered_by_kit') }}
      </span>
      <span class="font-medium">{{ kitInstallation?.kitName ?? '' }}</span>
    </div>
    <Button
      variant="ghost"
      size="sm"
      class="h-7 text-xs"
      @click="clearKitFilter"
    >
      <LucideX class="mr-1 h-3 w-3" />
      {{ $t('workflows.clear_filter') }}
    </Button>
  </div>

  <NuxtErrorBoundary>
    <TableView
      :loading="loading"
      :entity-name="entityName"
      :columns="columns"
      :data="dataList"
      :init-visibility-state="visibilityState"
      :searchable-fields="searchableFields"
      :error="fetchError"
      :on-retry="refresh"
    >
      <template #empty-actions>
        <ButtonIcon
          icon="new"
          variant="secondary"
          @click="navigateTo('/settings/orchestrator/variables/new')"
        >
          {{ $t('create_new_entity', { entityName }) }}
        </ButtonIcon>
      </template>
    </TableView>
  </NuxtErrorBoundary>
</template>
