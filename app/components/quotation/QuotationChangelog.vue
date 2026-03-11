<script setup lang="ts">
import { TableMode } from '#shared/types';
import type { ChangelogEntry, ChangelogChange } from '#shared/types';

const props = withDefaults(
  defineProps<{
    entries: ChangelogEntry[];
    loading?: boolean;
    error?: boolean;
  }>(),
  {
    loading: false,
    error: false,
  },
);

const emit = defineEmits<{
  retry: [];
}>();

const { t } = useI18n();
const { formatDate } = useDate();

interface ChangelogRow {
  _id: string;
  date: string;
  user: string;
  action: string;
  area: string;
  details: string;
}

function parseChanges(
  subEntity: string | undefined,
  changesJson: string | undefined,
): string {
  if (!changesJson) return '-';
  try {
    const changes: ChangelogChange[] = JSON.parse(changesJson);
    if (!changes.length) return '-';

    if (subEntity === 'status') {
      const statusChange = changes.find((ch) => ch.p === 'status');
      if (statusChange && statusChange.c && statusChange.c.length >= 2) {
        return `${statusChange.c[0]} → ${statusChange.c[1]}`;
      }
    }

    if (subEntity === 'message') {
      const authorChange = changes.find((ch) => ch.p === 'authorId');
      const typeChange = changes.find((ch) => ch.p === 'messageType');
      const parts: string[] = [];
      if (authorChange?.c?.[0]) parts.push(`by ${authorChange.c[0]}`);
      if (typeChange?.c?.[0]) parts.push(`(${typeChange.c[0]})`);
      return parts.join(' ') || '-';
    }

    return changes
      .map((ch) => {
        const vals = ch.c ?? [];
        if (vals.length === 2) return `${ch.p}: ${vals[0]} → ${vals[1]}`;
        if (vals.length === 1) return `${ch.p}: ${vals[0]}`;
        return ch.p;
      })
      .join(', ');
  } catch {
    return '-';
  }
}

const rows = computed<ChangelogRow[]>(() =>
  props.entries.map((entry) => ({
    _id: entry.id,
    date: formatDate(entry.changeDate),
    user: entry.identity || '-',
    action: entry.action || '-',
    area: entry.subEntity || '-',
    details: parseChanges(entry.subEntity, entry.changes),
  })),
);

const { getColumns, orderAndFilterColumns } = useColumns<ChangelogRow>();

const columns = computed(() => {
  if (rows.value.length === 0) return [];
  const cols = getColumns(rows.value, {
    sortable: false,
    includeColumns: ['date', 'user', 'action', 'area', 'details'],
    columnTitles: {
      date: t('changelog.col_date'),
      user: t('changelog.col_user'),
      action: t('changelog.col_action'),
      area: t('changelog.col_area'),
      details: t('changelog.col_details'),
    },
    columnTypes: {
      date: 'default',
      user: 'default',
      action: 'default',
      area: 'default',
      details: 'default',
    },
  });
  return orderAndFilterColumns(cols, [
    'date',
    'user',
    'action',
    'area',
    'details',
  ]);
});
</script>

<template>
  <TableView
    :columns="columns"
    :data="rows"
    entity-name="changelog_entry"
    :mode="TableMode.Minimal"
    :loading="loading"
    :error="error"
    :empty-description="$t('changelog.empty')"
    :on-retry="() => emit('retry')"
  />
</template>
