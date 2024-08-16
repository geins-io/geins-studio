import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { TableView } from '#components';
import { useColumns } from '#imports';

interface MockType {
  id: number;
  name: string;
}

const mockData: MockType[] = [
  {
    id: 1,
    name: 'Name 1',
  },
  {
    id: 2,
    name: 'Name 2',
  },
];

const { getColumns } = useColumns<MockType>();
const mockColumns = getColumns(mockData);

describe('TableView', () => {
  it('can mount the component', async () => {
    const component = await mountSuspended(TableView, {
      props: {
        data: mockData,
        columns: mockColumns,
      },
    });
    expect(component.html()).toMatch('table-view');
  });
});
