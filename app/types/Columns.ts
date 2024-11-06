export interface ColumnOptions {
  selectable?: boolean;
  sortable?: boolean;
  editUrl?: string;
  columnTypes?: ColumnTypes;
}

export interface ColumnTypes {
  [key: string]: 'string' | 'currency' | 'date' | 'number' | 'image' | 'link';
}
