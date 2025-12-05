<script setup lang="ts">
import { h } from 'vue';
import type { ColumnOptions, StringKeyOf } from '#shared/types';
import workflows from './mock-workflows.json';

interface Workflow {
  id: string;
  status: 'active' | 'pause';
  name: string;
  type: 'hook' | 'cron' | 'trigger';
  system: string;
  typeLabel: string;
  created: string;
  modified: string;
  lastExecution: string;
  runs: number;
  success: number;
  fails: number;
  runsLabel: string;
  successLabel: string;
  failsLabel: string;
}

type Entity = Workflow;
type EntityList = Workflow;

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const dataList = ref<EntityList[]>([
  ...(workflows as EntityList[]).map((workflow) => {
    let typeLabel: string = workflow.type;
    switch (workflow.type) {
      case 'hook':
        typeLabel = '🪝 Hook';
        break;
      case 'cron':
        typeLabel = '⏲️ Cron';
        break;
      case 'trigger':
        typeLabel = '⚡ Trigger';
        break;
    }

    const runsLabel = workflow.runs.toLocaleString();
    const successLabel = `${workflow.success}%`;
    const failsLabel = `${workflow.fails}%`;

    return {
      ...workflow,
      typeLabel,
      runsLabel,
      successLabel,
      failsLabel,
    };
  }),
]);
const entityName = 'Workflows';
const loading = ref(false);
const newEntityUrl = '#';

// SET UP COLUMN OPTIONS FOR ENTITY
const columnOptions: ColumnOptions<EntityList> = {
  columnTypes: {
    name: 'link',
    status: 'status',
    created: 'date',
    modified: 'date',
    lastExecution: 'date',
  },
  excludeColumns: ['runs', 'success', 'fails', 'successLabel'],
  columnTitles: {
    typeLabel: 'Type',
    runsLabel: 'Runs',
    failsLabel: 'Fails',
  },
  linkColumns: {
    name: {
      url: '/integrations/workflows/{id}',
      idField: 'id',
    },
  },
};

// GET AND SET COLUMNS
const { getColumns, addActionsColumn, extendColumns, getBasicCellStyle, getBasicHeaderStyle } =
  useColumns<EntityList>();
const columns = getColumns(dataList.value, columnOptions);

extendColumns(columns, {
  id: 'successLabel',
  accessorKey: 'successLabel',
  header: ({ table }) =>
    h(
      'div',
      {
        class: getBasicHeaderStyle(table),
      },
      'Success',
    ),
  cell: ({ table, row }) => {
    const label = row.getValue('successLabel') as string;
    const value = Number.parseFloat(label);
    const isHigh = value >= 99;
    const colorClass = isHigh ? 'text-emerald-600' : 'text-amber-500';

    return h(
      'div',
      {
        class: `${getBasicCellStyle(table)} ${colorClass}`,
      },
      label,
    );
  },
  meta: { type: 'default', title: 'Success' },
});

const deleteDialogOpen = ref(false);
const deleting = ref(false);
const deleteId = ref<string | undefined>();

const openDeleteDialog = async (id?: string) => {
  await nextTick();
  deleteId.value = id;
  deleteDialogOpen.value = true;
};

const confirmDelete = async () => {
  if (!deleteId.value) return;
  deleting.value = true;
  dataList.value = dataList.value.filter((item) => item.id !== deleteId.value);
  deleting.value = false;
  deleteDialogOpen.value = false;
};

// Row actions
const handleReplay = (item: Entity) => {
  // Placeholder implementation for replay action
  // eslint-disable-next-line no-console
  console.log('Replay workflow', item.id);
};

const handleLogs = (item: Entity) => {
  // Placeholder implementation for logs action
  // eslint-disable-next-line no-console
  console.log('View logs for workflow', item.id);
};

const handlePause = (item: Entity) => {
  dataList.value = dataList.value.map((workflow) =>
    workflow.id === item.id
      ? {
        ...workflow,
        status: workflow.status === 'active' ? 'pause' : 'active',
      }
      : workflow,
  );
};

addActionsColumn(
  columns,
  {
    onReplay: (item: Entity) => handleReplay(item),
    onLogs: (item: Entity) => handleLogs(item),
    onPause: (item: Entity) => handlePause(item),
    onDelete: async (item: Entity) => {
      await openDeleteDialog(item.id);
    },
  },
  'actions',
  ['replay', 'logs', 'pause', 'delete'],
);

// SET COLUMN VISIBILITY STATE
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = [];
const visibilityState = getVisibilityState(hiddenColumns);

// SET UP SEARCHABLE FIELDS
const searchableFields: Array<keyof EntityList> = [
  'id',
  'name',
  'type',
  'status',
  'system',
];
</script>

<template>
  <DialogDelete v-model:open="deleteDialogOpen" :entity-name="entityName" :loading="deleting"
    @confirm="confirmDelete" />
  <ContentHeader :title="$t(entityName, 2)">
    <ContentActionBar>
      <ButtonIcon icon="new" :href="newEntityUrl">
        {{ $t('new_entity', { entityName }) }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>
  <NuxtErrorBoundary>
    <TableView :loading="loading" :entity-name="entityName" :columns="columns" :data="dataList"
      :init-visibility-state="visibilityState" :searchable-fields="searchableFields">
      <template #empty-actions />
    </TableView>
    <template #error="{ error: errorCatched }">
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: $t(entityName, 2) }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
