export interface BatchQuery extends EntityBase {
  page: number;
  pageSize: number;
}

export interface BatchQueryResult<T> extends EntityBase {
  page: number;
  pageSize: number;
  totalItemCount: number;
  pageCount: number;
  items: T[];
}
