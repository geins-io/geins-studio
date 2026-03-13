<script setup lang="ts">
import { TableMode } from '#shared/types';
import type {
  ChangelogEntry,
  ChangelogChange,
  StatusBadgeStatus,
} from '#shared/types';
import type { ColumnDef, Table } from '@tanstack/vue-table';

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

const { formatDate } = useDate();

interface ChangelogRow {
  _id: string;
  date: string;
  user: string;
  action: string;
  area: string;
  changes: ParsedChange[];
}

interface ParsedChange {
  property: string;
  from?: string;
  to?: string;
  value?: string;
}

function parseChanges(changesJson: string | undefined): ParsedChange[] {
  if (!changesJson) return [];
  try {
    const raw: ChangelogChange[] = JSON.parse(changesJson);
    return raw.map((ch) => {
      const vals = ch.c ?? [];
      if (vals.length >= 2)
        return { property: ch.p, from: vals[0], to: vals[1] };
      if (vals.length === 1) return { property: ch.p, value: vals[0] };
      return { property: ch.p };
    });
  } catch {
    return [];
  }
}

function isValidDate(val: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(val) && !val.startsWith('0001-');
}

const filteredEntries = computed(() =>
  props.entries.filter((e) => e.subEntity !== 'message'),
);

const rows = computed<ChangelogRow[]>(() =>
  filteredEntries.value.map((entry) => ({
    _id: String(entry.id),
    date: formatDate(entry.changeDate, {
      dateStyle: 'long',
      timeStyle: 'short',
    }),
    user: entry.identity || '-',
    action: entry.action || '-',
    area: entry.subEntity || '-',
    changes: parseChanges(entry.changes),
  })),
);

const {
  getColumns,
  orderAndFilterColumns,
  extendColumns,
  getBasicHeaderStyle,
  getBasicCellStyle,
} = useColumns<ChangelogRow>();

const changesColumn: ColumnDef<ChangelogRow> = {
  id: 'changes',
  header: ({ table }: { table: Table<ChangelogRow> }) =>
    h(
      'div',
      { class: cn(getBasicHeaderStyle(table), 'px-3 sm:px-3') },
      'Changes',
    ),
  cell: ({ row, table }) => {
    const changes = row.original.changes;
    if (!changes.length)
      return h('div', { class: getBasicCellStyle(table) }, '-');

    const parts: VNode[] = [];

    // Separate status and validTo changes so we can render them together
    const statusChange = changes.find(
      (c) => c.property === 'status' && c.from && c.to && c.from !== c.to,
    );
    const validToChange = changes.find((c) => c.property === 'validTo');
    const otherChanges = changes.filter(
      (c) => c.property !== 'status' && c.property !== 'validTo',
    );

    // Render validTo date change
    if (validToChange) {
      const fromFormatted =
        validToChange.from && isValidDate(validToChange.from)
          ? formatDate(validToChange.from, { dateStyle: 'long' })
          : (validToChange.from ?? '-');
      const toFormatted =
        validToChange.to && isValidDate(validToChange.to)
          ? formatDate(validToChange.to, { dateStyle: 'long' })
          : (validToChange.to ??
            (validToChange.value
              ? formatDate(validToChange.value, { dateStyle: 'long' })
              : '-'));

      const dateParts: VNode[] = [];
      if (validToChange.from && validToChange.to) {
        dateParts.push(
          h('span', { class: 'inline-flex items-center gap-1.5' }, [
            h('span', fromFormatted),
            h(resolveComponent('LucideArrowRight'), {
              class: 'text-muted-foreground size-3',
            }),
            h('span', toFormatted),
          ]),
        );
      } else {
        dateParts.push(h('span', toFormatted));
      }

      // Append status transition on the same row if it's a real change
      if (statusChange) {
        dateParts.push(
          h('span', { class: 'inline-flex items-center gap-1.5 ml-3' }, [
            h(resolveComponent('StatusBadge'), {
              status: statusChange.from as StatusBadgeStatus,
            }),
            h(resolveComponent('LucideArrowRight'), {
              class: 'text-muted-foreground size-3',
            }),
            h(resolveComponent('StatusBadge'), {
              status: statusChange.to as StatusBadgeStatus,
            }),
          ]),
        );
      }

      parts.push(
        h('span', { class: 'inline-flex items-center gap-1.5' }, dateParts),
      );
    } else if (statusChange) {
      // Pure status change (no validTo)
      parts.push(
        h('span', { class: 'inline-flex items-center gap-1.5' }, [
          h(resolveComponent('StatusBadge'), {
            status: statusChange.from as StatusBadgeStatus,
          }),
          h(resolveComponent('LucideArrowRight'), {
            class: 'text-muted-foreground size-3',
          }),
          h(resolveComponent('StatusBadge'), {
            status: statusChange.to as StatusBadgeStatus,
          }),
        ]),
      );
    }

    // Render remaining changes as text
    for (const change of otherChanges) {
      if (parts.length > 0) {
        parts.push(h('span', { class: 'mx-1.5 text-muted-foreground' }, '·'));
      }
      const vals = [change.from, change.to].filter(Boolean);
      if (vals.length === 2) {
        parts.push(h('span', `${change.property}: ${vals[0]} → ${vals[1]}`));
      } else if (change.value) {
        parts.push(h('span', `${change.property}: ${change.value}`));
      } else {
        parts.push(h('span', change.property));
      }
    }

    return h(
      'div',
      {
        class: `flex flex-wrap items-center gap-y-1 ${getBasicCellStyle(table)}`,
      },
      parts,
    );
  },
};

// Derive columns once when entries first arrive.
const columns = ref<ColumnDef<ChangelogRow>[]>([]);
watch(
  () => filteredEntries.value.length,
  (len) => {
    if (len > 0 && columns.value.length === 0) {
      const base = orderAndFilterColumns(
        getColumns(rows.value, {
          excludeColumns: ['area', 'changes'],
          sortable: false,
        }),
        ['date', 'user', 'action'],
      );
      extendColumns(base, changesColumn);
      columns.value = base;
    }
  },
  { immediate: true },
);

// Only render TableView once columns are ready — mounting it with
// columns=[] causes a browser hang (TanStack Table + empty column set).
const ready = computed(() => columns.value.length > 0 || !props.loading);
</script>

<template>
  <template v-if="ready">
    <TableView
      :columns="columns"
      :data="rows"
      entity-name="changelog_entry"
      :mode="TableMode.Simple"
      :loading="loading && rows.length === 0"
      :error="error"
      :on-retry="() => emit('retry')"
    />
  </template>
  <div v-else class="flex items-center justify-center py-8">
    <LucideLoader2 class="text-muted-foreground size-6 animate-spin" />
  </div>
</template>
