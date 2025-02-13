export interface QueryResult<T> {
  batchId: string;
  page: number;
  pageSize: number;
  totalItemCount: number;
  pageCount: number;
  items: T[];
}
