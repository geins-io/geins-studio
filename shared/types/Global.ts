export type StringKeyOf<T> = Extract<keyof T, string>;

export interface GeinsEntity {
  _id?: string;
  _type?: string;
  name?: string;
}

export interface DataItem {
  label: string;
  value: string;
}

export type DataList = DataItem[];

export interface NavigationItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: unknown;
  children?: NavigationItem[];
}
