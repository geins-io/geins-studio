import '@tanstack/vue-table';
import type { RowData } from '@tanstack/vue-table';

export interface ColumnOptions {
  selectable?: boolean;
  sortable?: boolean;
  editUrl?: string;
  columnTitles?: { [key: string]: string };
  columnTypes?: ColumnTypes;
}

export interface ColumnTypes {
  [key: string]: ColumnType;
}

export type ColumnType =
  | 'string'
  | 'currency'
  | 'date'
  | 'number'
  | 'image'
  | 'link';

declare module '@tanstack/vue-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    title: string;
    type: ColumnType;
  }
}
