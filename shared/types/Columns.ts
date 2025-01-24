import '@tanstack/vue-table';
import type { RowData } from '@tanstack/vue-table';

export type ColumnType =
  | 'string'
  | 'currency'
  | 'date'
  | 'number'
  | 'image'
  | 'link'
  | 'select'
  | 'actions';

export type ColumnTypes<T> = Partial<Record<keyof T, ColumnType>>;

export interface ColumnOptions<T> {
  selectable?: boolean;
  sortable?: boolean;
  editUrl?: string;
  columnTitles?: Partial<Record<keyof T, string>>;
  columnTypes?: ColumnTypes<T>;
  maxTextLength?: number;
}

declare module '@tanstack/vue-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    title?: string;
    type: ColumnType;
  }
}
