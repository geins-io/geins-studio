export interface GeinsEntity {
  _id: string;
  _type: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: unknown;
  children?: NavigationItem[];
}
