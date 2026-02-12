import type { SelectorCondition } from './Selector';

export interface BatchQuery {
  _id?: string;
  page?: number;
  pageSize?: number;
  all?: boolean;
}

export interface BatchQueryFiltered<T> extends BatchQuery {
  include?: BatchQueryFilterGroup<T>[];
  exclude?: BatchQueryFilterGroup<T>[];
}

export interface BatchQueryFilterGroup<T> extends BatchQuery {
  condition?: SelectorCondition;
  selections: T[];
}

export interface BatchQueryResult<T> {
  _id: string;
  page: number;
  pageSize: number;
  totalItemCount: number;
  pageCount: number;
  items: T[];
}

export interface ApiOptions<TFields> {
  fields?: TFields[];
  pageSize?: string;
}
