import type { StringKeyOf } from './Global';
import '@tanstack/vue-table';
import type { RowData } from '@tanstack/vue-table';
import type { Component } from 'vue';

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
  | 'icon'
  | 'link'
  | 'select'
  | 'actions'
  | 'expander'
  | 'channels'
  | 'tags'
  | 'status'
  | 'tooltip'
  | 'product'
  | 'flag'
  | 'switch'
  | `editable-${EditableColumnType}`;

export type ColumnTypes<T> = Partial<Record<StringKeyOf<T>, ColumnType>>;

export type ColumnKey<T> = keyof T | ColumnType;

export interface LinkColumnConfig<T> {
  url?: string;
  idField?: StringKeyOf<T>;
  /** Use the cell value itself as the URL */
  useValueAsUrl?: boolean;
  /** Render as an external link (opens in new tab, shows external icon) */
  external?: boolean;
  /** Override the shared maxTextLength for this column only */
  maxTextLength?: number;
}

export interface IconColumnConfig<T> {
  /** Static icon for all rows */
  icon?: Component;
  /** Derive icon + optional CSS class from the row data */
  resolveIcon?: (row: T) => { icon: Component; class?: string } | undefined;
  url?: string;
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
  iconColumns?: Partial<Record<StringKeyOf<T>, IconColumnConfig<T>>>;
  maxTextLength?: number;
}

declare module '@tanstack/vue-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    title?: string;
    type: ColumnType;
    skipInactiveDim?: boolean;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    mode: TableMode;
    entityName: string;
  }
}
