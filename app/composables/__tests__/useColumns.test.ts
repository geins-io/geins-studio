import { describe, it, expect } from 'vitest';
import { useColumns } from '../useColumns';

interface Row {
  _id: string;
  name: string;
  productCount: number;
}

const rows: Row[] = [{ _id: '1', name: 'Sweden', productCount: 3 }];

describe('getColumns columnSizes', () => {
  it('fixes the size of the named columns only', () => {
    const { getColumns } = useColumns<Row>();
    const columns = getColumns(rows, {
      includeColumns: ['name', 'productCount'],
      columnSizes: { productCount: 120 },
    });
    const byId = (id: string) => columns.find((column) => column.id === id);

    expect(byId('productCount')).toMatchObject({
      size: 120,
      minSize: 120,
      maxSize: 120,
    });
    expect(byId('name')).toMatchObject({ size: 0, minSize: 0, maxSize: 0 });
  });
});
