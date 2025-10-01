import '@tanstack/vue-table';
import type { RowData } from '@tanstack/vue-table';

export type TableRowAction = 'edit' | 'copy' | 'delete';

export const enum TableMode {
  Simple = 'simple',
  Advanced = 'advanced',
  Minimal = 'minimal',
}

export type EditableColumnType =
  | 'string'
  | 'number'
  | 'select'
  | 'currency'
  | 'boolean'
  | 'percentage';

export type ColumnType =
  | 'default'
  | 'string'
  | 'currency'
  | 'price'
  | 'date'
  | 'number'
  | 'image'
  | 'entity-link'
  | 'select'
  | 'actions'
  | 'channels'
  | 'tags'
  | 'status'
  | 'tooltip'
  | 'boolean'
  | `editable-${EditableColumnType}`
  | 'pricelist-quantity-levels';

export type ColumnTypes<T> = Partial<Record<keyof T, ColumnType>>;

export interface ColumnOptions<T> {
  selectable?: boolean;
  sortable?: boolean;
  columnTitles?: Partial<Record<StringKeyOf<T>, string>>;
  columnTypes?: ColumnTypes<T>;
  columnSortable?: Partial<Record<StringKeyOf<T>, boolean>>;
  columnOrder?: StringKeyOf<T>[];
  excludeColumns?: StringKeyOf<T>[];
  includeColumns?: StringKeyOf<T>[];
  columnCellProps?: Partial<Record<StringKeyOf<T>, Record<string, unknown>>>;
  entityLinkUrl?: string;
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
