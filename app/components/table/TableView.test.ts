import { describe, it, expect } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { TableMode } from '#shared/types';
import { mountWithContext } from '../../../test/helpers';
import type { ColumnDef, Table } from '@tanstack/vue-table';
import { TableHeaderSort, TableView } from '#components';

interface Row {
  _id: string;
  name: string;
}

const columns: ColumnDef<Row>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => h(TableHeaderSort<Row>, { column, title: 'Name' }),
    cell: ({ row }) => h('span', { 'data-test': 'name' }, row.original.name),
  },
];

const rows: Row[] = [
  { _id: '2', name: 'b' },
  { _id: '1', name: 'a' },
  { _id: '3', name: 'c' },
];

type Wrapper = Awaited<ReturnType<typeof mountWithContext>>;

const names = (wrapper: Wrapper) =>
  wrapper.findAll('[data-test="name"]').map((cell) => cell.text());

const tableOf = (wrapper: Wrapper) =>
  wrapper
    .findComponent({ name: 'TablePagination' })
    .props('table') as Table<Row>;

const nextPageButton = (wrapper: Wrapper) => {
  const button = wrapper
    .findAll('button')
    .find((b) => b.text().includes('Go to next page'));
  if (!button) throw new Error('next page button not found');
  return button;
};

const mountTable = (props: Record<string, unknown>) =>
  mountWithContext(TableView, {
    props: { columns, data: rows, mode: TableMode.Simple, ...props },
  });

describe('TableView — server mode', () => {
  const serverProps = {
    dataSource: 'server',
    rowCount: 90,
    pagination: { pageIndex: 0, pageSize: 30 },
    sorting: [],
  };

  it('emits update:pagination on next page', async () => {
    const wrapper = await mountTable(serverProps);
    await nextPageButton(wrapper).trigger('click');
    expect(wrapper.emitted('update:pagination')?.[0]).toEqual([
      { pageIndex: 1, pageSize: 30 },
    ]);
  });

  it('emits a single-column update:sorting on header click', async () => {
    const wrapper = await mountTable({
      ...serverProps,
      sorting: [{ id: 'other', desc: true }],
    });
    await wrapper.find('th button').trigger('click');
    expect(wrapper.emitted('update:sorting')?.[0]).toEqual([
      [{ id: 'name', desc: false }],
    ]);
  });

  it('takes the total and page count from rowCount', async () => {
    const wrapper = await mountTable(serverProps);
    const table = tableOf(wrapper);
    expect(table.options.rowCount).toBe(90);
    expect(table.getPageCount()).toBe(3);
    expect(table.getCanNextPage()).toBe(true);
  });

  it('renders the rows as given, without re-sorting them', async () => {
    const wrapper = await mountTable({
      ...serverProps,
      sorting: [{ id: 'name', desc: false }],
    });
    expect(names(wrapper)).toEqual(['b', 'a', 'c']);
  });

  it('keeps the current rows while a later page loads', async () => {
    const wrapper = await mountTable({ ...serverProps, loading: true });
    expect(names(wrapper)).toEqual(['b', 'a', 'c']);
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true);
  });

  it('writes search without debouncing', async () => {
    const wrapper = await mountTable({
      ...serverProps,
      showSearch: true,
      search: '',
    });
    await wrapper.find('[data-test="table-search"] input').setValue('hero');
    expect(wrapper.emitted('update:search')?.[0]).toEqual(['hero']);
  });
});

describe('TableView — client mode', () => {
  it('sorts and pages the rows itself', async () => {
    const wrapper = await mountTable({ pageSize: 2 });
    expect(names(wrapper)).toEqual(['b', 'a']);

    await wrapper.find('th button').trigger('click');
    expect(names(wrapper)).toEqual(['a', 'b']);
    expect(wrapper.emitted('update:sorting')).toBeUndefined();

    const table = tableOf(wrapper);
    expect(table.getPageCount()).toBe(2);
    await nextPageButton(wrapper).trigger('click');
    expect(names(wrapper)).toEqual(['c']);
    expect(wrapper.emitted('update:pagination')).toBeUndefined();
  });

  it('follows a changed pageSize prop', async () => {
    const pageSize = ref(2);
    const Host = defineComponent({
      setup: () => () =>
        h(TableView<Row, unknown>, {
          columns,
          data: rows,
          mode: TableMode.Simple,
          pageSize: pageSize.value,
        }),
    });
    const wrapper = await mountWithContext(Host);
    pageSize.value = 60;
    await nextTick();
    expect(tableOf(wrapper).getState().pagination.pageSize).toBe(60);
    expect(names(wrapper)).toEqual(['b', 'a', 'c']);
  });
});

describe('TableView — server mode selection', () => {
  const selectColumns: ColumnDef<Row>[] = [
    {
      id: 'select',
      header: ({ table }) =>
        h('input', {
          type: 'checkbox',
          'data-test': 'select-page',
          checked: table.getIsAllPageRowsSelected(),
          onChange: (e: Event) =>
            table.toggleAllPageRowsSelected(
              (e.target as HTMLInputElement).checked,
            ),
        }),
      cell: ({ row }) =>
        h('input', {
          type: 'checkbox',
          'data-test': `select-${row.id}`,
          checked: row.getIsSelected(),
          onChange: (e: Event) =>
            row.toggleSelected((e.target as HTMLInputElement).checked),
        }),
    },
    ...columns,
  ];

  const page1: Row[] = [
    { _id: '1', name: 'a' },
    { _id: '2', name: 'b' },
    { _id: '3', name: 'c' },
  ];
  const page2: Row[] = [
    { _id: '4', name: 'd' },
    { _id: '5', name: 'e' },
  ];

  const mountServer = async (seed?: string[]) => {
    const data = ref(page1);
    const selectedIds = ref(seed);
    const selections: Row[][] = [];
    const idUpdates: string[][] = [];
    const tableRef = ref<{ clearSelection: () => void }>();
    const Host = defineComponent({
      setup: () => () =>
        h(TableView<Row, unknown>, {
          ref: tableRef,
          columns: selectColumns,
          data: data.value,
          mode: TableMode.Simple,
          dataSource: 'server',
          rowCount: 5,
          pagination: { pageIndex: 0, pageSize: 3 },
          selectedIds: selectedIds.value,
          onSelection: (selection: Row[]) => selections.push(selection),
          'onUpdate:selectedIds': (ids: string[]) => idUpdates.push(ids),
        }),
    });
    const wrapper = await mountWithContext(Host);
    const selectedCount = () =>
      wrapper.findComponent({ name: 'TablePagination' }).props('selectedCount');
    return {
      wrapper,
      data,
      selectedIds,
      selections,
      idUpdates,
      tableRef,
      selectedCount,
    };
  };

  const ids = (selection: Row[] | undefined) => selection?.map((r) => r._id);

  it('keeps rows selected on earlier pages', async () => {
    const t = await mountServer();
    await t.wrapper.find('[data-test="select-1"]').setValue(true);
    t.data.value = page2;
    await nextTick();
    await t.wrapper.find('[data-test="select-4"]').setValue(true);

    expect(ids(t.selections.at(-1))).toEqual(['1', '4']);
    expect(t.idUpdates.at(-1)).toEqual(['1', '4']);
    expect(t.selectedCount()).toBe(2);
  });

  it('counts seeded ids before their rows load, and emits them once they do', async () => {
    const t = await mountServer(['4']);
    expect(t.selectedCount()).toBe(1);
    expect(t.selections).toHaveLength(0);

    t.data.value = page2;
    await nextTick();
    expect(ids(t.selections.at(-1))).toEqual(['4']);
    expect(
      (t.wrapper.find('[data-test="select-4"]').element as HTMLInputElement)
        .checked,
    ).toBe(true);
  });

  it('deselects a row that is not loaded via selectedIds', async () => {
    const t = await mountServer(['1', '4']);
    t.selectedIds.value = ['1'];
    await nextTick();
    expect(t.selectedCount()).toBe(1);

    t.data.value = page2;
    await nextTick();
    expect(
      (t.wrapper.find('[data-test="select-4"]').element as HTMLInputElement)
        .checked,
    ).toBe(false);
  });

  it('toggles only the current page from the header checkbox', async () => {
    const t = await mountServer(['4']);
    await t.wrapper.find('[data-test="select-page"]').setValue(true);
    expect(t.idUpdates.at(-1)).toEqual(['4', '1', '2', '3']);
    expect(ids(t.selections.at(-1))).toEqual(['1', '2', '3']);

    await t.wrapper.find('[data-test="select-page"]').setValue(false);
    expect(t.idUpdates.at(-1)).toEqual(['4']);
    expect(t.selectedCount()).toBe(1);
  });

  it('clears the whole selection via clearSelection()', async () => {
    const t = await mountServer(['1', '4']);
    t.tableRef.value?.clearSelection();
    await nextTick();
    expect(t.idUpdates.at(-1)).toEqual([]);
    expect(t.selectedCount()).toBe(0);
  });
});
