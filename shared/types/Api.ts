export interface BatchQuery {
  _id?: string;
  page?: number;
  pageSize?: number;
  all?: boolean;
}

export interface BatchQueryResult<T> {
  _id: string;
  page: number;
  pageSize: number;
  totalItemCount: number;
  pageCount: number;
  items: T[];
}
