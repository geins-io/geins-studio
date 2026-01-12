import '@tanstack/vue-table';
import type { Column, RowData } from '@tanstack/vue-table';

export type TableRowAction = 'edit' | 'copy' | 'delete';

export const enum TableMode {
  Simple = 'simple',
  Advanced = 'advanced',
  Minimal = 'minimal',
}

export type EditableColumnType =
  | 'string'
  | 'number'
  | 'currency'
  | 'percentage';

export type ColumnType =
  | 'default'
  | 'currency'
  | 'price'
  | 'date'
  | 'number'
  | 'image'
  | 'link'
  | 'select'
  | 'actions'
  | 'expander'
  | 'channels'
  | 'tags'
  | 'status'
  | 'tooltip'
  | `editable-${EditableColumnType}`;

export type ColumnTypes<T> = Partial<Record<StringKeyOf<T>, ColumnType>>;

export type ColumnKey<T> = keyof T | ColumnType;

export interface LinkColumnConfig<T> {
  url: string;
  idField?: StringKeyOf<T>;
}

export interface ColumnOptions<T> {
  selectable?: boolean;
  sortable?: boolean;
  columnTitles?: Partial<Record<StringKeyOf<T>, string>>;
  columnTypes?: ColumnTypes<T>;
  sortableColumns?: Partial<Record<StringKeyOf<T>, boolean>>;
  excludeColumns?: StringKeyOf<T>[];
  includeColumns?: StringKeyOf<T>[];
  columnCellProps?: Partial<Record<StringKeyOf<T>, Record<string, unknown>>>;
  linkColumns?: Partial<Record<StringKeyOf<T>, LinkColumnConfig<T>>>;
  maxTextLength?: number;
}

declare module '@tanstack/vue-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    title?: string;
    type: ColumnType;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    mode: TableMode;
    entityName: string;
  }
}
