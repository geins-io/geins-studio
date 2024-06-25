export interface ColumnOptions {
  selectable?: boolean;
  sortable?: boolean;
  columnTypes?: ColumnTypes;
}

export interface ColumnTypes {
  [key: string]: 'string' | 'currency' | 'date' | 'number';
}
