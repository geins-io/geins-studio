export interface QueryResult<T> extends EntityBase {
  page: number;
  pageSize: number;
  totalItemCount: number;
  pageCount: number;
  items: T[];
}
