import type { GeinsEntity } from '#shared/types';

export interface QueryResult<T> extends GeinsEntity {
  page: number;
  pageSize: number;
  totalItemCount: number;
  pageCount: number;
  items: T[];
}
