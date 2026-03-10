<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table';
import { TableMode, type ChangelogEntry, type ChangelogChange } from '#shared/types';

const props = withDefaults(
  defineProps<{
    data: ChangelogEntry[];
    loading?: boolean;
    error?: boolean;
    onRetry?: () => void;
  }>(),
  {
    loading: false,
    error: false,
    onRetry: undefined,
  },
);

const { t } = useI18n();

interface ChangelogRow {
  changeDate: string;
  identity: string;
  action: string;
  area: string;
  details: string;
}

/**
 * Parse the `changes` JSON string into a human-readable summary.
 * - Status transition (subEntity=status): "draft → pending"
 * - Message (subEntity=message): "by user@email (toCustomer)"
 * - Otherwise: show individual property changes
 */
function parseChanges(entry: ChangelogEntry): string {
  if (!entry.changes) {
    return '';
  }

  let parsed: ChangelogChange[] = [];
  try {
    parsed = JSON.parse(entry.changes) as ChangelogChange[];
  } catch {
    return entry.changes;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return '';
  }

  if (entry.subEntity === 'status') {
    const statusChange = parsed.find((c) => c.p === 'status');
    if (statusChange && statusChange.c.length >= 2) {
      return `${statusChange.c[0]} → ${statusChange.c[1]}`;
    }
  }

  if (entry.subEntity === 'message') {
    const authorChange = parsed.find((c) => c.p === 'authorId');
    const typeChange = parsed.find((c) => c.p === 'messageType');
    const parts: string[] = [];
    if (authorChange?.c[0]) {
      parts.push(`by ${authorChange.c[0]}`);
    }
    if (typeChange?.c[0]) {
      parts.push(`(${typeChange.c[0]})`);
    }
    return parts.join(' ');
  }

  return parsed.map((c) => `${c.p}: ${c.c.join(' → ')}`).join(', ');
}

const tableData = computed<ChangelogRow[]>(() =>
  props.data.map((entry) => ({
    changeDate: entry.changeDate,
    identity: entry.identity ?? '—',
    action: entry.action,
    area: entry.subEntity || '—',
    details: parseChanges(entry),
  })),
);

const { getColumns } = useColumns<ChangelogRow>();

const columns = computed<ColumnDef<ChangelogRow>[]>(() =>
  getColumns(tableData.value, {
    includeColumns: ['changeDate', 'identity', 'action', 'area', 'details'],
    sortable: false,
    columnTypes: {
      changeDate: 'date',
    },
    columnTitles: {
      changeDate: t('changelog.column_date'),
      identity: t('changelog.column_user'),
      action: t('changelog.column_action'),
      area: t('changelog.column_area'),
      details: t('changelog.column_details'),
    },
  }),
);
</script>

<template>
  <div>
    <Feedback
      v-if="error"
      type="negative"
      class="mb-4"
    >
      <template #title>{{ $t('changelog.error_title') }}</template>
      <template #description>{{ $t('changelog.error_description') }}</template>
      <template v-if="onRetry" #actions>
        <Button variant="outline" size="sm" @click="onRetry">
          {{ $t('error_try_again') }}
        </Button>
      </template>
    </Feedback>
    <TableView
      v-else
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :mode="TableMode.Minimal"
      :pinned-state="null"
      :show-empty-actions="false"
      :empty-text="$t('changelog.empty_text')"
      :empty-description="$t('changelog.empty_description')"
    />
  </div>
</template>
