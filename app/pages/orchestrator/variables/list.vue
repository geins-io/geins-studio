<script setup lang="ts">
import type {
  WorkflowVariable,
  ColumnOptions,
  StringKeyOf,
} from '#shared/types';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';
import type { Component } from 'vue';
import {
  LucideKeyRound,
  LucideEye,
  LucideCircleAlert,
} from '#components';

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

const scope = 'pages/orchestrator/variables/list.vue';
const { t } = useI18n();

definePageMeta({
  pageType: 'list',
});

// ─── Global Setup ──────────────────────────────────────────────────
const { orchestratorApi } = useGeinsRepository();
const breadcrumbsStore = useBreadcrumbsStore();
const allData = ref<EntityList[]>([]);
const entityName = 'variable';
const loading = ref(true);
const columns = ref<ColumnDef<EntityList>[]>([]);
const visibilityState = ref<VisibilityState>({});

usePageError({ entityName, entityList: true, scope });
const fetchError = ref(false);

watch(() => t('navigation.variables'), (title) => {
  breadcrumbsStore.setCurrentTitle(title, true);
}, { immediate: true });

// ─── Fetch Data ────────────────────────────────────────────────────
const { data: variables, error: variableError, refresh } = await useAsyncData<Entity[]>(
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
    displayValue: v.isSecret ? maskValue(v.value) : (v.value || '–'),
    description: v.description ?? '',
    isSecret: v.isSecret,
    createdAt: formatTimestamp(v.createdAt),
    updatedAt: formatTimestamp(v.updatedAt),
  }));

const dataList = computed(() => allData.value);

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

  const resolveSecretIcon = (row: EntityList): { icon: Component; class: string } => {
    return row.isSecret
      ? { icon: LucideKeyRound, class: 'text-yellow-500' }
      : { icon: LucideEye, class: 'text-muted-foreground' };
  };

  const columnOptions: ColumnOptions<EntityList> = {
    columnTypes: {
      key: 'link',
      isSecret: 'icon',
    },
    linkColumns: {
      key: { url: '/orchestrator/variables/{id}', idField: 'key' },
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
  <ContentHeader :title="$t('navigation.variables')" :description="$t('variables.description')">
    <ContentActionBar>
      <ButtonIcon icon="new" href="/orchestrator/variables/new">
        {{ $t('new_entity', { entityName }) }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>

  <NuxtErrorBoundary>
    <TableView
      :loading="loading"
      :entity-name="entityName"
      :columns="columns"
      :data="dataList"
      :init-visibility-state="visibilityState"
      :searchable-fields="searchableFields"
      :error="fetchError"
      :on-retry="refresh">
      <template #empty-actions>
        <ButtonIcon icon="new" variant="secondary" @click="navigateTo('/orchestrator/variables/new')">
          {{ $t('create_new_entity', { entityName }) }}
        </ButtonIcon>
      </template>
    </TableView>
  </NuxtErrorBoundary>
</template>
